// src/quickadd/services/QuickAddFlowService.ts

import { Message } from "discord.js";
import { processOCR } from "./OCRService";
import { detectImageType } from "../detector/ImageTypeDetector";
import { parseByType } from "../parsers/ParserExecutor";
import { SessionData } from "../session/SessionData";

// =====================================
// 🔥 DEBUG HELPER
// =====================================
function debug(tag: string, ...args: any[]) {
  console.log(`[QA:${tag}]`, ...args);
}

// =====================================
// 🔹 mapper
// =====================================
function mapEntry(entry: any) {
  const valueNumber = parseInt(entry.value || "0");

  return {
    nickname: entry.nickname,
    value: isNaN(valueNumber) ? 0 : valueNumber,
    raw: entry.raw || entry.rawText || "",
  };
}

// =====================================
// 🔹 CORE LOGIC
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

  if (!session.parserType && type) {
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

  if (!entries || entries.length === 0) {
    debug("FLOW", "❌ NO ENTRIES");
    await message.reply("❌ Couldn't detect data.");
    return;
  }

  const mapped = entries.map(mapEntry);

  SessionData.addEntries(message.guildId!, mapped);

  await message.react("✅");
}

// =====================================
// 🔥 BATCH PROCESSOR (FIXED)
// =====================================
async function processBatch(message: Message, session: any) {
  debug("BATCH", "🔥 START");

  const flat = session.buffer.ocrResults;

  const allLines = flat.map((x: any) => x.lines).flat();
  const traces = flat.map((x: any) => x.traceId);

  debug("BATCH", "📄 TOTAL LINES:", allLines.length);
  debug("BATCH", "🧵 TRACE IDS:", traces);

  if (allLines.length === 0) {
    debug("BATCH", "❌ EMPTY INPUT");
    await message.reply("❌ No OCR data collected.");
    return;
  }

  let type = detectImageType(allLines, session.parserType);

  debug("BATCH", "🧠 DETECTED TYPE:", type);

  if (!type && session.parserType) {
    debug("BATCH", "🔒 FALLBACK TYPE:", session.parserType);
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
    debug("BATCH", "📦 PARSED ENTRIES:", entries.length);
  } catch (err) {
    debug("BATCH", "❌ PARSER CRASH:", err);
    await message.reply("❌ Parser error.");
    return;
  }

  if (!entries.length) {
    debug("BATCH", "❌ EMPTY PARSE RESULT");
    await message.reply("❌ No valid entries parsed.");
    return;
  }

  await handleParsedData(message, session, type, entries);

  // 🧹 reset
  session.buffer.ocrResults = [];
}

// =====================================
// 🖼️ OCR FLOW
// =====================================
export async function processImageInput(
  message: Message,
  session: any,
  imageUrl: string
) {
  const traceId = Date.now().toString().slice(-5);

  debug(traceId, "📸 IMAGE INPUT", imageUrl);

  const { lines } = await processOCR(imageUrl);

  debug(traceId, "📄 OCR lines:", lines.length);

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
// 📝 TEXT FLOW
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