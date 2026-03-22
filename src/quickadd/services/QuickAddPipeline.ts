// src/quickadd/services/QuickAddPipeline.ts

import { Message } from "discord.js";
import { processOCR } from "./OCRService";
import { detectImageType } from "../detector/ImageTypeDetector";
import { parseByType } from "../parsers/ParserExecutor";
import { SessionStore } from "../session/sessionStore";

import {
  resolveNickname,
  resolveNicknameFuzzy,
  saveNickMappings,
} from "./QuickAddNicknameService";

import { canParseDuelPoints } from "../parsers/DuelPointsParser";
import { canParseReservoirAttendance } from "../parsers/ReservoirAttendanceParser";
import { canParseReservoirRaid } from "../parsers/ReservoirRaidParser";

// =====================================
function debug(traceId: string, tag: string, ...args: any[]) {
  console.log(`[QA:${traceId}:${tag}]`, ...args);
}

const BATCH_DELAY = 10000;

// =====================================
function fallbackDetect(lines: string[]): any {
  if (canParseDuelPoints(lines)) return "DUEL_POINTS";
  if (canParseReservoirAttendance(lines)) return "RR_ATTENDANCE";
  if (canParseReservoirRaid(lines)) return "RR_RAID";
  return null;
}

// =====================================
// 🔥 ENTRY VALIDATION
// =====================================
function isValidEntry(e: any): boolean {
  if (!e) return false;
  if (!e.nickname || e.nickname.length < 2) return false;
  if (typeof e.value !== "number") return false;
  if (isNaN(e.value)) return false;
  if (e.value <= 0) return false;
  return true;
}

// =====================================
async function mapEntry(entry: any) {
  const rawNick = entry.nickname || "";

  const exact = await resolveNickname(rawNick);
  const fuzzy = exact ? await resolveNicknameFuzzy(exact) : null;

  const value =
    typeof entry.value === "number"
      ? entry.value
      : Number(entry.value);

  return {
    nickname: (fuzzy || rawNick || "").trim(),
    value: isNaN(value) ? 0 : value,
    raw: entry.raw || entry.rawText || "",
  };
}

// =====================================
// 🔥 EXPORT (SAFE MODE)
export async function execute(payload: {
  parserType: any;
  entries: any[];
  guildId: string;
  targetType: string;
  targetId: string;
}) {
  console.log("=================================");
  console.log("🚀 EXECUTE (SAFE MODE)");
  console.log("=================================");

  console.log("Guild:", payload.guildId);
  console.log("Parser:", payload.parserType);
  console.log("TargetType:", payload.targetType);
  console.log("TargetId:", payload.targetId);
  console.log("Entries:", payload.entries.length);

  payload.entries.forEach((e, i) => {
    console.log(`[${i}] ${e.nickname} → ${e.value}`);
  });

  console.log("=================================");
  console.log("✅ NO DB WRITE (SAFE MODE)");
  console.log("=================================");
}

// =====================================
async function processBatch(message: Message, session: any) {
  const traceId = Date.now().toString().slice(-5);

  debug(traceId, "BATCH_START");

  const buffer = session?.buffer?.ocrResults;

  if (!buffer?.length) {
    debug(traceId, "EMPTY_BUFFER");
    return;
  }

  let allEntries: any[] = [];
  let finalType: any = session.parserType || null;

  for (const batch of buffer) {
    const lines = batch.lines || [];
    if (!lines.length) continue;

    // 🔥 DEBUG LINES
    debug(traceId, "LINES_PREVIEW", lines.slice(0, 10));

    let type =
      detectImageType(lines, session.parserType) ||
      fallbackDetect(lines) ||
      session.parserType;

    if (!type) continue;

    try {
      const parsed = parseByType(type, lines);

      if (parsed.length) {
        finalType = type;

        const valid = parsed.filter(isValidEntry);

        debug(traceId, "PARSED_RAW", parsed.length);
        debug(traceId, "PARSED_VALID", valid.length);

        allEntries.push(...valid);
      }
    } catch (err) {
      console.error("💥 PARSER ERROR:", err);
    }
  }

  if (!allEntries.length) {
    await message.reply("❌ No valid entries parsed.");
    return;
  }

  // =====================================
  // 🔥 DEDUPE ENTRIES
  // =====================================
  const uniqueMap = new Map<string, any>();

  for (const e of allEntries) {
    const key = e.nickname.toLowerCase();

    if (!uniqueMap.has(key) || uniqueMap.get(key).value < e.value) {
      uniqueMap.set(key, e);
    }
  }

  allEntries = Array.from(uniqueMap.values());

  debug(traceId, "AFTER_DEDUPE", allEntries.length);

  // =====================================
  const mapped = await Promise.all(allEntries.map(mapEntry));

  debug(traceId, "MAPPED_ENTRIES", mapped.length);
  debug(traceId, "FINAL_TYPE", finalType);

  // =====================================
  // 🔥 SINGLE SOURCE OF TRUTH
  SessionStore.addEntries(message.guildId!, mapped);

  const finalEntries = SessionStore.getEntries(message.guildId!);

  debug(traceId, "FINAL_SESSION_ENTRIES", finalEntries.length);

  // =====================================
  // 🔥 SAFE MODE (no DB writes)
  try {
    if (process.env.DEV_MODE === "true") {
      console.log("🧠 DEV MODE: skip nick mapping save");
    } else {
      await saveNickMappings(mapped);
    }
  } catch {
    console.warn("⚠️ Nick mapping failed (non-blocking)");
  }

  await message.reply(`✅ Processed ${mapped.length} entries.`);

  session.buffer.ocrResults = [];
  session.buffer.timer = null;
}

// =====================================
export async function processImageInput(
  message: Message,
  session: any,
  imageUrl: string
) {
  const traceId = Date.now().toString().slice(-5);

  debug(traceId, "IMAGE");

  const { lines } = await processOCR(imageUrl);

  if (!lines?.length) {
    debug(traceId, "OCR_EMPTY");
    return;
  }

  session.buffer.ocrResults.push({
    lines,
    traceId,
  });

  await message.react("✅");

  if (session.buffer.timer) {
    clearTimeout(session.buffer.timer);
  }

  session.buffer.timer = setTimeout(() => {
    processBatch(message, session);
  }, BATCH_DELAY);
}

// =====================================
export async function processTextInput(
  message: Message,
  session: any,
  content: string
) {
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (!lines.length) return;

  session.buffer.ocrResults.push({
    lines,
    traceId: "text",
  });

  if (session.buffer.timer) {
    clearTimeout(session.buffer.timer);
  }

  session.buffer.timer = setTimeout(() => {
    processBatch(message, session);
  }, 5000);
}