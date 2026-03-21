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
function fallbackDetect(lines: string[]): any {
  if (canParseDuelPoints(lines)) return "DUEL_POINTS";
  if (canParseReservoirAttendance(lines)) return "RR_ATTENDANCE";
  if (canParseReservoirRaid(lines)) return "RR_RAID";
  return null;
}

// =====================================
async function mapEntry(entry: any) {
  let nickname = entry.nickname;

  const exact = await resolveNickname(nickname);
  const fuzzy = await resolveNicknameFuzzy(exact);

  const valueNumber = parseInt(entry.value || "0");

  return {
    nickname: fuzzy,
    value: isNaN(valueNumber) ? 0 : valueNumber,
    raw: entry.raw || entry.rawText || "",
  };
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

  if (!session.parserType && entries.length >= 2) {
    session.parserType = type;
    debug("FLOW", `🔒 Parser locked: ${type}`);
  }

  if (session.parserType && type && session.parserType !== type) {
    await message.reply(
      `❌ Wrong data type.\nExpected: ${session.parserType}, got: ${type}`
    );
    return;
  }

  if (!entries.length) {
    await message.reply("❌ Couldn't detect data.");
    return;
  }

  const mapped = [];
  for (const e of entries) {
    mapped.push(await mapEntry(e));
  }

  SessionData.addEntries(message.guildId!, mapped);

  await message.react("✅");
}

// =====================================
async function processBatch(message: Message, session: any) {
  debug("BATCH", "🔥 START");

  if (!session || !session.buffer) {
    debug("BATCH", "❌ SESSION DEAD");
    return;
  }

  // 🔥 BLOKADA – żeby nie odpalić 2x
  if (session.processing) {
    debug("BATCH", "⛔ ALREADY PROCESSING");
    return;
  }

  session.processing = true;

  const flat = session.buffer.ocrResults;

  const allLines = flat.map((x: any) => x.lines).flat();

  debug("BATCH", "📄 TOTAL LINES:", allLines.length);

  if (!allLines.length) {
    await message.reply("❌ No OCR data collected.");
    session.processing = false;
    return;
  }

  let type = detectImageType(allLines, session.parserType);

  if (!type) {
    const fallback = fallbackDetect(allLines);
    if (fallback) type = fallback;
  }

  if (!type && session.parserType) {
    type = session.parserType;
  }

  if (!type) {
    await message.reply("❌ Could not detect data type.");
    session.processing = false;
    return;
  }

  let entries: any[] = [];

  try {
    entries = parseByType(type, allLines);
  } catch (err) {
    await message.reply("❌ Parser error.");
    session.processing = false;
    return;
  }

  if (!entries.length) {
    await message.reply("❌ No valid entries parsed.");
    session.processing = false;
    return;
  }

  await handleParsedData(message, session, type, entries);

  // 🔥 RESET SESJI
  session.buffer.ocrResults = [];
  session.buffer.timer = undefined;
  session.processing = false;

  debug("BATCH", "✅ DONE");
}

// =====================================
const IDLE_TIMEOUT = 10000; // ⬅️ 10 sekund

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

  // ✅ FEEDBACK
  await message.react("✅");

  // 🔥 RESET TIMERA
  if (session.buffer.timer) {
    clearTimeout(session.buffer.timer);
  }

  // 🔥 CZEKA AŻ USER SKOŃCZY WYSYŁAĆ
  session.buffer.timer = setTimeout(async () => {
    debug("TIMER", "⏳ IDLE → PROCESS");
    await processBatch(message, session);
  }, IDLE_TIMEOUT);
}

// =====================================
export async function processTextInput(
  message: Message,
  session: any,
  content: string
) {
  const traceId = Date.now().toString().slice(-5);

  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  session.buffer.ocrResults.push({
    lines,
    traceId,
  });

  await message.react("✅");

  if (session.buffer.timer) {
    clearTimeout(session.buffer.timer);
  }

  session.buffer.timer = setTimeout(async () => {
    await processBatch(message, session);
  }, IDLE_TIMEOUT);
}