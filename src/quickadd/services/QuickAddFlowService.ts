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
// 🔥 SMART TYPE FALLBACK
// =====================================
function fallbackDetect(lines: string[]): any {
  if (canParseDuelPoints(lines)) return "DUEL_POINTS";
  if (canParseReservoirAttendance(lines)) return "RR_ATTENDANCE";
  if (canParseReservoirRaid(lines)) return "RR_RAID";
  return null;
}

// =====================================
// 🔹 mapper + nickname resolve
// =====================================
async function mapEntry(entry: any) {
  let nickname = entry.nickname;

  debug("MAP", "🔤 RAW NICK:", nickname);

  // 🔥 EXACT MATCH
  const exact = await resolveNickname(nickname);
  debug("MAP", "🎯 EXACT:", exact);

  // 🔥 FUZZY fallback
  const fuzzy = await resolveNicknameFuzzy(exact);
  debug("MAP", "🧠 FUZZY:", fuzzy);

  const valueNumber = parseInt(entry.value || "0");

  const mapped = {
    nickname: fuzzy,
    value: isNaN(valueNumber) ? 0 : valueNumber,
    raw: entry.raw || entry.rawText || "",
  };

  debug("MAP", "✅ FINAL:", mapped);

  return mapped;
}

// =====================================
async function handleParsedData(
  message: Message,
  session: any,
  type: any,
  entries: any[]
) {
  debug("FLOW", "TYPE:", type);
  debug("FLOW", "ENTRIES COUNT:", entries.length);

  entries.slice(0, 5).forEach((e, i) => {
    debug("FLOW", `ENTRY[${i}]`, e);
  });

  // 🔥 LOCK tylko gdy mamy sensowny wynik
  if (!session.parserType && entries.length >= 2) {
    session.parserType = type;
    debug("FLOW", `🔒 Parser locked: ${type}`);
  }

  if (session.parserType && type && session.parserType !== type) {
    debug("FLOW", "❌ TYPE MISMATCH");
    await message.reply(
      `❌ Wrong data type.\nExpected: ${session.parserType}, got: ${type}`
    );
    return;
  }

  if (!entries.length) {
    debug("FLOW", "❌ NO ENTRIES");
    await message.reply("❌ Couldn't detect data.");
    return;
  }

  // 🔥 ASYNC MAP
  const mapped = [];
  for (const e of entries) {
    mapped.push(await mapEntry(e));
  }

  debug("FLOW", "🧪 MAPPED ENTRIES:");
  mapped.forEach((e, i) => {
    debug("FLOW", `[${i}]`, e);
  });

  SessionData.addEntries(message.guildId!, mapped);

  await message.react("✅");
}

// =====================================
async function processBatch(message: Message, session: any) {
  debug("BATCH", "🔥 START");

  // 🔥 SAFETY — sesja mogła umrzeć
  if (!session || !session.buffer) {
    debug("BATCH", "❌ SESSION DEAD");
    return;
  }

  const flat = session.buffer.ocrResults;

  const allLines = flat.map((x: any) => x.lines).flat();
  const traces = flat.map((x: any) => x.traceId);

  debug("BATCH", "🧵 TRACE IDS:", traces);
  debug("BATCH", "📄 TOTAL LINES:", allLines.length);

  // 🔥 KLUCZOWE — pełny dump linii
  debug("BATCH", "🧾 ALL LINES:");
  allLines.forEach((l: string, i: number) => {
    debug("BATCH", `[${i}]`, l);
  });

  if (!allLines.length) {
    debug("BATCH", "❌ EMPTY INPUT");
    await message.reply("❌ No OCR data collected.");
    return;
  }

  let type = detectImageType(allLines, session.parserType);

  debug("BATCH", "🧠 DETECTED TYPE:", type);

  // 🔥 fallback layer
  if (!type) {
    const fallback = fallbackDetect(allLines);
    if (fallback) {
      debug("BATCH", "🧠 FALLBACK TYPE:", fallback);
      type = fallback;
    }
  }

  if (!type && session.parserType) {
    debug("BATCH", "🔒 USING LOCKED TYPE:", session.parserType);
    type = session.parserType;
  }

  if (!type) {
    debug("BATCH", "❌ TYPE NOT DETECTED");
    await message.reply("❌ Could not detect data type.");
    return;
  }

  let entries: any[] = [];

  try {
    entries = parseByType(type, allLines);
    debug("BATCH", "📦 PARSED ENTRIES COUNT:", entries.length);
  } catch (err) {
    debug("BATCH", "❌ PARSER CRASH:", err);
    await message.reply("❌ Parser error.");
    return;
  }

  // 🔥 pełny dump parsera
  debug("BATCH", "📦 RAW PARSED ENTRIES FULL:");
  entries.forEach((e, i) => {
    debug("BATCH", `[${i}]`, e);
  });

  if (!entries.length) {
    debug("BATCH", "❌ EMPTY PARSE RESULT");
    await message.reply("❌ No valid entries parsed.");
    return;
  }

  await handleParsedData(message, session, type, entries);

  // 🔥 FULL RESET
  session.buffer.ocrResults = [];
  session.buffer.timer = undefined;
}

// =====================================
export async function processImageInput(
  message: Message,
  session: any,
  imageUrl: string
) {
  const traceId = Date.now().toString().slice(-5);

  debug(traceId, "📸 IMAGE INPUT", imageUrl);

  const { lines } = await processOCR(imageUrl);

  debug(traceId, "📄 OCR LINES:", lines.length);

  session.buffer.ocrResults.push({
    lines,
    traceId,
  });

  if (session.buffer.timer) {
    clearTimeout(session.buffer.timer);
  }

  session.buffer.timer = setTimeout(async () => {
    await processBatch(message, session);
  }, 800);
}

// =====================================
export async function processTextInput(
  message: Message,
  session: any,
  content: string
) {
  const traceId = Date.now().toString().slice(-5);

  debug(traceId, "📝 TEXT INPUT");

  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  debug(traceId, "📄 TEXT LINES:", lines.length);

  session.buffer.ocrResults.push({
    lines,
    traceId,
  });

  if (session.buffer.timer) {
    clearTimeout(session.buffer.timer);
  }

  session.buffer.timer = setTimeout(async () => {
    await processBatch(message, session);
  }, 500);
}