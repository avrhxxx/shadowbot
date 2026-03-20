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

  for (const entry of entries) {
    console.log("➕ ADD ENTRY:", entry);
    SessionData.addEntry(message.guildId!, mapEntry(entry));
  }

  await message.react("✅");
}

// =====================================
// 🖼️ OCR FLOW
// =====================================
export async function processImageInput(
  message: Message,
  session: any,
  imageUrl: string
) {
  console.log("📸 FLOW: IMAGE INPUT");

  const { text, lines } = await processOCR(imageUrl);

  console.log("📄 OCR lines:", lines.length);

  // 🔥 FIX: używamy session.parserType + fallback
  let type = detectImageType(lines, session.parserType);

  if (!type && session.parserType) {
    console.log("🔒 Fallback to locked parser:", session.parserType);
    type = session.parserType;
  }

  console.log("🧠 DETECTED TYPE:", type);

  const entries = parseByType(type, lines);

  await handleParsedData(message, session, type, entries);
}

// =====================================
// 📝 TEXT FLOW
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

  console.log("LINES:", lines);

  // 🔥 FIX: używamy session.parserType + fallback
  let type = detectImageType(lines, session.parserType);