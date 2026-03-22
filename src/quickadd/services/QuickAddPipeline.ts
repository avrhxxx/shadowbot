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
// 🧠 STATUS
async function sendStatus(message: Message, text: string) {
  try {
    await message.reply(text);
  } catch {
    console.warn("⚠️ STATUS SEND FAILED");
  }
}

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
function scoreEntry(e: any): number {
  let score = 0;

  score += (e.confidence || 0) * 10;

  if (e.value >= 20000 && e.value <= 100000) score += 5;
  if (e.value > 150000) score -= 10;

  return score;
}

function pickBetterEntry(a: any, b: any) {
  return scoreEntry(b) > scoreEntry(a) ? b : a;
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

  // 🔥 LOCK
  if (session.isProcessing) {
    debug(traceId, "SKIP_ALREADY_PROCESSING");
    return;
  }

  session.isProcessing = true;

  try {
    const buffer = session?.buffer?.ocrResults;

    if (!buffer?.length) {
      debug(traceId, "EMPTY_BUFFER_SKIP");
      return;
    }

    debug(traceId, "BATCH_START", buffer.length);

    await sendStatus(
      message,
      `🧠 Processing ${buffer.length} screenshots...`
    );

    const screens: any[] = [];

    for (const batch of buffer) {
      const lines = batch.lines || [];
      if (!lines.length) continue;

      let type =
        detectImageType(lines, session.parserType) ||
        fallbackDetect(lines) ||
        session.parserType;

      if (!type) continue;

      try {
        let parsed = parseByType(type, lines);
        parsed = parsed.filter(isValidEntry);

        screens.push({
          type,
          entries: parsed,
        });
      } catch (err) {
        console.error("💥 PARSER ERROR:", err);
      }
    }

    if (!screens.length) {
      await sendStatus(message, "❌ No valid entries parsed.");
      return;
    }

    // =====================================
    // 🧠 MERGE
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

        merged.set(key, pickBetterEntry(existing, e));
      }
    }

    const mapped = await Promise.all(
      Array.from(merged.values()).map(mapEntry)
    );

    SessionStore.addEntries(message.guildId!, mapped);

    // =====================================
    // SAVE NICKS
    // =====================================
    try {
      if (process.env.DEV_MODE !== "true") {
        await saveNickMappings(mapped);
      }
    } catch {
      console.warn("⚠️ Nick mapping failed");
    }

    await sendStatus(
      message,
      `✅ Done! ${mapped.length} entries added from ${buffer.length} screenshots.`
    );

    // =====================================
    // RESET
    // =====================================
    session.buffer.ocrResults = [];
    session.buffer.timer = null;
    session.imageCount = 0;
  } finally {
    session.isProcessing = false;
  }
}

// =====================================
export async function processImageInput(
  message: Message,
  session: any,
  imageUrl: string
) {
  const traceId = Date.now().toString().slice(-5);

  debug(traceId, "IMAGE_RECEIVED");

  // 🔥 NATYCHMIASTOWY FEEDBACK (BEZ OCR)
  session.imageCount = (session.imageCount || 0) + 1;

  await message.react("✅");

  await sendStatus(
    message,
    `📥 Screenshot ${session.imageCount} received\n⏳ Send more within ${BATCH_DELAY / 1000}s...`
  );

  // 🔥 OCR W TLE (nie blokuje UX)
  const { lines } = await processOCR(imageUrl);

  if (!lines?.length) {
    debug(traceId, "OCR_EMPTY");
    return;
  }

  session.buffer.ocrResults.push({
    lines,
    traceId,
  });

  // 🔥 RESET TIMER
  if (session.buffer.timer) {
    clearTimeout(session.buffer.timer);
  }

  session.buffer.timer = setTimeout(() => {
    processBatch(message, session);
  }, BATCH_DELAY);
}

// =====================================
export async function execute(payload: any) {
  console.log("🚀 EXECUTE SAFE MODE", payload.entries.length);
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