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
function isValidEntry(e: any): boolean {
  if (!e) return false;
  if (!e.nickname || e.nickname.length < 2) return false;
  if (typeof e.value !== "number") return false;
  if (isNaN(e.value)) return false;
  if (e.value <= 0) return false;
  return true;
}

// =====================================
// 🔥 OUTLIER FILTER (KEY)
function isOutlier(value: number): boolean {
  return value > 200000;
}

// =====================================
// 🔥 SCORING SYSTEM (SERCE)
function scoreEntry(e: any): number {
  let score = 0;

  // parser confidence
  score += (e.confidence || 0) * 10;

  // realistyczny zakres donations
  if (e.value >= 20000 && e.value <= 100000) score += 5;

  // kara za dziwne wartości
  if (e.value > 150000) score -= 10;

  return score;
}

// =====================================
function pickBetterEntry(a: any, b: any) {
  const scoreA = scoreEntry(a);
  const scoreB = scoreEntry(b);

  if (scoreB > scoreA) return b;
  return a;
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
async function processBatch(message: Message, session: any) {
  const traceId = Date.now().toString().slice(-5);

  debug(traceId, "BATCH_START");

  const buffer = session?.buffer?.ocrResults;
  if (!buffer?.length) {
    debug(traceId, "EMPTY_BUFFER");
    return;
  }

  // =====================================
  // 🧠 1. PARSE PER SCREEN (IZOLACJA)
  // =====================================
  const screens: any[] = [];

  for (const batch of buffer) {
    const lines = batch.lines || [];
    if (!lines.length) continue;

    debug(traceId, "LINES_PREVIEW", lines.slice(0, 10));

    let type =
      detectImageType(lines, session.parserType) ||
      fallbackDetect(lines) ||
      session.parserType;

    if (!type) continue;

    try {
      let parsed = parseByType(type, lines);

      if (!parsed.length) continue;

      // =====================================
      // 🔥 FILTER PER SCREEN
      // =====================================
      parsed = parsed
        .filter(isValidEntry)
        .filter((e) => !isOutlier(e.value));

      debug(traceId, "SCREEN_PARSED", {
        type,
        raw: parsed.length,
      });

      screens.push({
        type,
        entries: parsed,
      });
    } catch (err) {
      console.error("💥 PARSER ERROR:", err);
    }
  }

  if (!screens.length) {
    await message.reply("❌ No valid entries parsed.");
    return;
  }

  // =====================================
  // 🧠 2. SMART MERGE (ZAMIAST MAX VALUE)
  // =====================================
  const merged = new Map<string, any>();

  for (const screen of screens) {
    for (const e of screen.entries) {
      const key = e.nickname.toLowerCase();
      const existing = merged.get(key);

      if (!existing) {
        merged.set(key, e);
        continue;
      }

      const better = pickBetterEntry(existing, e);

      debug(traceId, "MERGE_DECISION", {
        nick: key,
        existing: existing.value,
        incoming: e.value,
        chosen: better.value,
        scoreExisting: scoreEntry(existing),
        scoreIncoming: scoreEntry(e),
      });

      merged.set(key, better);
    }
  }

  let allEntries = Array.from(merged.values());

  debug(traceId, "AFTER_MERGE", allEntries.length);

  // =====================================
  // 🧠 3. MAP NICKNAMES (NA KOŃCU)
  // =====================================
  const mapped = await Promise.all(allEntries.map(mapEntry));

  debug(traceId, "MAPPED", mapped.length);

  // =====================================
  // 🧠 4. SESSION STORE
  // =====================================
  SessionStore.addEntries(message.guildId!, mapped);

  const finalEntries = SessionStore.getEntries(message.guildId!);

  debug(traceId, "FINAL_SESSION", finalEntries.length);

  // =====================================
  // 🧠 5. SAVE NICK MAPPINGS
  // =====================================
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

  // =====================================
  // 🔥 RESET BUFFER
  // =====================================
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

  // 🔥 zapisujemy SUROWE linie (bez parsowania)
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