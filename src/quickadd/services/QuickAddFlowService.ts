// src/quickadd/services/QuickAddFlowService.ts

import { Message } from "discord.js";
import { processOCR } from "./OCRService";
import { detectImageType } from "../detector/ImageTypeDetector";
import { parseByType } from "../parsers/ParserExecutor";
import { SessionData } from "../session/SessionData";

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
  console.log("=== FLOW: HANDLE PARSED DATA ===");
  console.log("TYPE:", type);
  console.log("ENTRIES:", entries.length);

  // 🔒 AUTO LOCK
  if (!session.parserType && type) {
    session.parserType = type;
    console.log(`🔒 Parser locked: ${type}`);
  }

  // ❌ MIX BLOCK
  if (session.parserType && type && session.parserType !== type) {
    console.log("❌ TYPE MISMATCH");
    await message.reply(
      `❌ Wrong data type.\nExpected: ${session.parserType}, got: ${type}`
    );
    return;
  }

  if (!entries || entries.length === 0) {
    console.log("❌ NO ENTRIES");
    await message.reply("❌ Couldn't detect data.");
    return;
  }

  // 🔥 JEDEN zapis batcha
  const mapped = entries.map(mapEntry);

  SessionData.addEntries(message.guildId!, mapped);

  await message.react("✅");
}

// =====================================
// 🔥 BATCH PROCESSOR (NOWE)
// =====================================
async function processBatch(message: Message, session: any) {
  console.log("🔥 PROCESSING BATCH");

  const allLines = session.buffer.ocrResults.flat();

  console.log("📄 TOTAL LINES:", allLines.length);

  let type = detectImageType(allLines, session.parserType);

  if (!type && session.parserType) {
    console.log("🔒 Fallback to locked parser:", session.parserType);
    type = session.parserType;
  }

  console.log("🧠 FINAL TYPE:", type);

  const entries = parseByType(type, allLines);

  await handleParsedData(message, session, type, entries);

  // 🧹 reset buffer
  session.buffer.ocrResults = [];
}

// =====================================
// 🖼️ OCR FLOW (POPRAWIONE)
// =====================================
export async function processImageInput(
  message: Message,
  session: any,
  imageUrl: string
) {
  console.log("📸 FLOW: IMAGE INPUT");

  const { lines } = await processOCR(imageUrl);

  console.log("📄 OCR lines:", lines.length);

  // 🔥 tylko zbieramy dane
  session.buffer.ocrResults.push(lines);

  // 🔁 reset timera
  if (session.buffer.timer) {
    clearTimeout(session.buffer.timer);
  }

  // ⏱️ batch delay
  session.buffer.timer = setTimeout(async () => {
    await processBatch(message, session);
  }, 800);
}

// =====================================
// 📝 TEXT FLOW (opcjonalnie też batch)
// =====================================
export async function processTextInput(
  message: Message,
  session: any,
  content: string
) {
  console.log("📝 FLOW: TEXT INPUT");

  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  session.buffer.ocrResults.push(lines);

  if (session.buffer.timer) {
    clearTimeout(session.buffer.timer);
  }

  session.buffer.timer = setTimeout(async () => {
    await processBatch(message, session);
  }, 500);
}