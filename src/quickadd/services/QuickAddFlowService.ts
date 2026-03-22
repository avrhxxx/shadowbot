// src/quickadd/services/QuickAddFlowService.ts

import { Message } from "discord.js";
import { processOCR } from "./OCRService";
import { detectImageType } from "../detector/ImageTypeDetector";
import { parseByType } from "../parsers/ParserExecutor";
import { SessionData } from "../session/SessionData";

import {
  resolveNickname,
  resolveNicknameFuzzy,
} from "./QuickAddNicknameService";

import {
  canParseDuelPoints,
} from "../parsers/DuelPointsParser";

import {
  canParseReservoirAttendance,
} from "../parsers/ReservoirAttendanceParser";

import {
  canParseReservoirRaid,
} from "../parsers/ReservoirRaidParser";

// =====================================
function debug(tag: string, ...args: any[]) {
  console.log(`[QA:${tag}]`, ...args);
}

// =====================================
const BATCH_DELAY = 10000;

// =====================================
// 🧠 SMART FALLBACK
// =====================================
function fallbackDetect(lines: string[]): any {
  if (canParseDuelPoints(lines)) return "DUEL_POINTS";
  if (canParseReservoirAttendance(lines)) return "RR_ATTENDANCE";
  if (canParseReservoirRaid(lines)) return "RR_RAID";
  return null;
}

// =====================================
// 🔥 SAFE MAP ENTRY (FIXED)
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
    nickname: fuzzy || rawNick,
    value: isNaN(value) ? 0 : value,
    raw: entry.raw || entry.rawText || "",
  };
}

// =====================================
// 🔥 PRE-MERGE (ANTI DUPES BEFORE SESSION)
// =====================================
function preMerge(entries: any[]) {
  const map = new Map<string, any>();

  for (const e of entries) {
    const key = e.nickname.toLowerCase();
    const existing = map.get(key);

    if (!existing) {
      map.set(key, e);
      continue;
    }

    if (e.value > existing.value) {
      map.set(key, e);
    }
  }

  return Array.from(map.values());
}

// =====================================
async function handleParsedData(
  message: Message,
  session: any,
  type: any,
  entries: any[]
) {
  debug("FLOW", "TYPE:", type);
  debug("FLOW", "ENTRIES:", entries.length);

  if (!entries.length) {
    await message.reply("❌ No valid entries parsed.");
    return;
  }

  // 🔥 lock parser type
  if (!session.parserType) {
    session.parserType = type;
  }

  if (session.parserType && type !== session.parserType) {
    await message.reply(
      `❌ Wrong data type.\nExpected: ${session.parserType}, got: ${type}`
    );
    return;
  }

  // 🔥 PARALLEL MAP (faster)
  const mapped = await Promise.all(entries.map(mapEntry));

  // 🔥 PRE MERGE BEFORE SESSION
  const merged = preMerge(mapped);

  debug("FLOW", "AFTER PRE-MERGE:", merged.length);

  SessionData.addEntries(message.guildId!, merged);

  await message.reply(
    `✅ Parsed ${merged.length} entries from batch.`
  );
}

// =====================================
// 🔥 CORE — PER SCREEN (IMPROVED)
// =====================================
async function processBatch(message: Message, session: any) {
  debug("BATCH", "🔥 START");

  const buffer = session?.buffer?.ocrResults;

  if (!buffer?.length) {
    debug("BATCH", "❌ EMPTY BUFFER");
    return;
  }

  let allEntries: any[] = [];
  let finalType: any = session.parserType || null;

  for (const batch of buffer) {
    const lines = batch.lines || [];

    if (!lines.length) {
      debug(batch.traceId, "⚠️ EMPTY OCR LINES");
      continue;
    }

    debug(batch.traceId, "📄 LINES:", lines.length);

    let type =
      detectImageType(lines, session.parserType) ||
      fallbackDetect(lines) ||
      session.parserType;

    if (!type) {
      debug(batch.traceId, "❌ TYPE NOT DETECTED");
      continue;
    }

    debug(batch.traceId, "🧠 TYPE:", type);

    try {
      const parsed = parseByType(type, lines);

      debug(batch.traceId, "📥 PARSED:", parsed.length);

      if (parsed.length) {
        finalType = type;
        allEntries.push(...parsed);
      }

    } catch (err) {
      console.error("💥 PARSER ERROR:", err);
    }
  }

  debug("BATCH", "📊 TOTAL:", allEntries.length);

  if (!allEntries.length) {
    await message.reply("❌ No valid entries parsed from batch.");
    return;
  }

  await handleParsedData(message, session, finalType, allEntries);

  // 🔥 HARD RESET
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

  debug(traceId, "📸 IMAGE");

  const { lines } = await processOCR(imageUrl);

  if (!lines?.length) {
    debug(traceId, "❌ OCR EMPTY");
    return;
  }

  session.buffer.ocrResults.push({
    lines,
    traceId,
  });

  debug(traceId, "📦 BUFFER:", session.buffer.ocrResults.length);

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