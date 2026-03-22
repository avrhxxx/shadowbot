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
// 🧠 FALLBACK DETECT
// =====================================
function fallbackDetect(lines: string[]): any {
  if (canParseDuelPoints(lines)) return "DUEL_POINTS";
  if (canParseReservoirAttendance(lines)) return "RR_ATTENDANCE";
  if (canParseReservoirRaid(lines)) return "RR_RAID";
  return null;
}

// =====================================
// 🔥 MAP ENTRY
// =====================================
async function mapEntry(entry: any) {
  const rawNick = entry.nickname || "";

  const exact = await resolveNickname(rawNick);
  const fuzzy = await resolveNicknameFuzzy(exact);

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
// 🔥 PRE-MERGE
// =====================================
function preMerge(entries: any[]) {
  const map = new Map<string, any>();

  for (const e of entries) {
    const key = (e.nickname || "").toLowerCase().trim();
    if (!key) continue;

    const existing = map.get(key);

    if (!existing || e.value > existing.value) {
      map.set(key, e);
    }
  }

  return Array.from(map.values());
}

// =====================================
// 🚀 FINAL EXECUTION (MERGED SERVICE)
// =====================================
async function execute(
  parserType: any,
  entries: any[],
  guildId: string
) {
  console.log("=== EXECUTION START ===");
  console.log("Type:", parserType);
  console.log("Entries:", entries.length);

  // 🔥 SAVE NICK MAPPINGS
  try {
    await saveNickMappings(entries);
  } catch (err) {
    console.warn("⚠️ Nick mapping failed (non-blocking)");
  }

  switch (parserType) {
    case "RR_RAID":
    case "RR_ATTENDANCE": {
      const nicknames = entries.map((e) => e.nickname);
      console.log("📋 EVENT PARTICIPANTS:", nicknames);
      break;
    }

    case "DONATIONS": {
      for (const e of entries) {
        console.log("💰 DONATION:", {
          nick: e.nickname,
          points: e.value,
        });
      }
      break;
    }

    case "DUEL_POINTS": {
      for (const e of entries) {
        console.log("⚔️ DUEL:", {
          nick: e.nickname,
          points: e.value,
        });
      }
      break;
    }

    default:
      console.log("❌ Unknown type:", parserType);
  }

  console.log("=== EXECUTION END ===");
}

// =====================================
// 🔥 CORE BATCH PROCESS
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

    let type =
      detectImageType(lines, session.parserType) ||
      fallbackDetect(lines) ||
      session.parserType;

    if (!type) continue;

    try {
      const parsed = parseByType(type, lines);

      if (parsed.length) {
        finalType = type;
        allEntries.push(...parsed);
      }
    } catch (err) {
      console.error("💥 PARSER ERROR:", err);
    }
  }

  if (!allEntries.length) {
    await message.reply("❌ No valid entries parsed.");
    return;
  }

  const mapped = await Promise.all(allEntries.map(mapEntry));
  const merged = preMerge(mapped);

  debug(traceId, "FINAL_ENTRIES", merged.length);

  // 🔥 SAVE TO SESSION
  SessionStore.addEntries(message.guildId!, merged);

  // 🔥 EXECUTE FINAL LOGIC
  await execute(finalType, merged, message.guildId!);

  await message.reply(`✅ Processed ${merged.length} entries.`);

  // reset buffer
  session.buffer.ocrResults = [];
  session.buffer.timer = null;
}

// =====================================
// 📸 IMAGE INPUT
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
// 📝 TEXT INPUT
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