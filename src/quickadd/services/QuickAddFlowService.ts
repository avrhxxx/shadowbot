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
async function processBatch(message: Message, session: any) {
  debug("BATCH", "🔥 FINAL PROCESS START");

  if (!session || !session.buffer) return;

  const flat = session.buffer.ocrResults;

  if (!flat.length) {
    debug("BATCH", "❌ EMPTY BUFFER");
    return;
  }

  // 🔥 1. merge wszystkich screenów
  const allLines = flat.map((x: any) => x.lines).flat();

  debug("BATCH", "📄 TOTAL LINES:", allLines.length);

  // 🔥 2. detect type
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
    return;
  }

  // 🔥 3. parse CAŁOŚCI
  let entries: any[] = [];

  try {
    entries = parseByType(type, allLines);
  } catch (err) {
    debug("BATCH", "❌ PARSER ERROR:", err);
    await message.reply("❌ Parser error.");
    return;
  }

  if (!entries.length) {
    await message.reply("❌ No valid entries parsed.");
    return;
  }

  // 🔥 4. map
  const mapped = [];
  for (const e of entries) {
    mapped.push(await mapEntry(e));
  }

  // 🔥 5. wrzucenie DO SESSION (tu się robi merge!)
  SessionData.addEntries(message.guildId!, mapped);

  // 🔥 6. clear buffer (ale NIE session data!)
  session.buffer.ocrResults = [];
  session.buffer.timer = undefined;

  debug("BATCH", "✅ DONE");
}

// =====================================
function resetBatchTimer(message: Message, session: any) {
  if (session.buffer.timer) {
    clearTimeout(session.buffer.timer);
  }

  // 🔥 KLUCZOWE: czekamy aż user przestanie wysyłać screeny
  session.buffer.timer = setTimeout(async () => {
    await processBatch(message, session);
  }, 10000); // ⬅️ 10 sekund
}

// =====================================
export async function processImageInput(
  message: Message,
  session: any,
  imageUrl: string
) {
  const traceId = Date.now().toString().slice(-5);

  debug(traceId, "📸 IMAGE INPUT");

  const { lines } = await processOCR(imageUrl);

  debug(traceId, "📄 OCR LINES:", lines.length);

  // 🔥 dodajemy do bufora (NIE parsujemy jeszcze)
  session.buffer.ocrResults.push({
    lines,
    traceId,
  });

  // 🔥 reset timer
  resetBatchTimer(message, session);

  // ✅ feedback dla usera
  await message.react("✅");
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

  resetBatchTimer(message, session);

  await message.react("✅");
}