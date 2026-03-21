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
  debug("FLOW", "ENTRIES:", entries.length);

  if (!entries.length) {
    await message.reply("❌ No valid entries parsed.");
    return;
  }

  // 🔥 ustaw parserType od razu (pierwszy poprawny batch)
  if (!session.parserType) {
    session.parserType = type;
  }

  if (session.parserType && type !== session.parserType) {
    await message.reply(
      `❌ Wrong data type.\nExpected: ${session.parserType}, got: ${type}`
    );
    return;
  }

  const mapped = [];
  for (const e of entries) {
    mapped.push(await mapEntry(e));
  }

  SessionData.addEntries(message.guildId!, mapped);

  await message.reply(
    `✅ Parsed ${mapped.length} entries from batch.`
  );
}

// =====================================
// 🔥 NOWY CORE — PARSE PER SCREEN
// =====================================
async function processBatch(message: Message, session: any) {
  debug("BATCH", "🔥 START PER-SCREEN PARSE");

  if (!session?.buffer?.ocrResults?.length) {
    debug("BATCH", "❌ EMPTY BUFFER");
    return;
  }

  let allEntries: any[] = [];
  let finalType: any = session.parserType || null;

  for (const batch of session.buffer.ocrResults) {
    const lines = batch.lines;

    debug(batch.traceId, "📄 LINES:", lines.length);

    let type = detectImageType(lines, session.parserType);

    if (!type) {
      type = fallbackDetect(lines);
    }

    if (!type && session.parserType) {
      type = session.parserType;
    }

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

  debug("BATCH", "📊 TOTAL ENTRIES:", allEntries.length);

  if (!allEntries.length) {
    await message.reply("❌ No valid entries parsed from batch.");
    return;
  }

  await handleParsedData(message, session, finalType, allEntries);

  // 🔥 reset buffer
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

  debug(traceId, "📸 IMAGE INPUT");

  const { lines } = await processOCR(imageUrl);

  session.buffer.ocrResults.push({
    lines,
    traceId,
  });

  debug(traceId, "📦 BUFFER SIZE:", session.buffer.ocrResults.length);

  await message.react("✅");

  if (session.buffer.timer) {
    clearTimeout(session.buffer.timer);
  }

  session.buffer.timer = setTimeout(async () => {
    await processBatch(message, session);
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

  session.buffer.ocrResults.push({
    lines,
    traceId: "text",
  });

  if (session.buffer.timer) {
    clearTimeout(session.buffer.timer);
  }

  session.buffer.timer = setTimeout(async () => {
    await processBatch(message, session);
  }, 5000);
}