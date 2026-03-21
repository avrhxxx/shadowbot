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

  // 🔥 EXACT MATCH
  nickname = await resolveNickname(nickname);

  // 🔥 FUZZY fallback
  nickname = await resolveNicknameFuzzy(nickname);

  const valueNumber = parseInt(entry.value || "0");

  return {
    nickname,
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
  debug("FLOW", "ENTRIES:", entries.length);

  // 🔥 LOCK tylko gdy mamy sensowny wynik
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

  // 🔥 ASYNC MAP
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

  // 🔥 SAFETY — sesja mogła umrzeć
  if (!session || !session.buffer) {
    debug("BATCH", "❌ SESSION DEAD");
    return;
  }

  const flat = session.buffer.ocrResults;

  const allLines = flat.map((x: any) => x.lines).flat();

  debug("BATCH", "📄 LINES:", allLines.length);

  if (!allLines.length) {
    await message.reply("❌ No OCR data collected.");
    return;
  }

  let type = detectImageType(allLines, session.parserType);

  // 🔥 fallback layer
  if (!type) {
    const fallback = fallbackDetect(allLines);
    if (fallback) {
      debug("BATCH", "🧠 FALLBACK TYPE:", fallback);
      type = fallback;
    }
  }

  if (!type && session.parserType) {
    type = session.parserType;
  }

  if (!type) {
    await message.reply("❌ Could not detect data type.");
    return;
  }

  let entries: any[] = [];

  try {
    entries = parseByType(type, allLines);
  } catch (err) {
    debug("BATCH", "❌ PARSER CRASH:", err);
    await message.reply("❌ Parser error.");
    return;
  }

  if (!entries.length) {
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

  const { lines } = await processOCR(imageUrl);

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

  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

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