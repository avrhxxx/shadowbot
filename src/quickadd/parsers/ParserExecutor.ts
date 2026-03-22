// src/quickadd/parsers/ParserExecutor.ts

import { ParserType } from "../session/sessionStore";
import { QuickAddEntry } from "../types/QuickAddEntry";

import { parseDonations } from "./DonationsParser";
import { parseDuelPoints } from "./DuelPointsParser";
import { parseReservoirRaid } from "./ReservoirRaidParser";
import { parseReservoirAttendance } from "./ReservoirAttendanceParser";

// =====================================
// 🔥 DEBUG
// =====================================
const DEBUG_PARSER = true;

function log(...args: any[]) {
  if (DEBUG_PARSER) {
    console.log("[PARSER]", ...args);
  }
}

// =====================================
// 🔥 TERAZ ASYNC
export async function parseByType(
  type: ParserType | null,
  lines: string[]
): Promise<QuickAddEntry[]> {
  if (!type) return [];

  let entries: QuickAddEntry[] = [];

  log("TYPE:", type);
  log("LINES:", lines.length);

  try {
    switch (type) {
      case "DONATIONS":
        entries = await parseDonations(lines); // 🔥 FIX
        break;

      case "DUEL_POINTS":
        entries = parseDuelPoints(lines);
        break;

      case "RR_RAID":
        entries = parseReservoirRaid(lines);
        break;

      case "RR_ATTENDANCE":
        entries = parseReservoirAttendance(lines);
        break;

      default:
        return [];
    }
  } catch (err) {
    log("❌ PARSER CRASH:", err);
    return [];
  }

  log("RAW_ENTRIES:", entries.length);

  // =====================================
  // 🔥 HARD FILTER (ANTI OCR GARBAGE)
  // =====================================
  const filtered = entries.filter((e) => {
    if (!e) return false;

    const nick = e.nickname?.trim();
    const value = e.value;

    if (!nick || nick.length < 2) return false;

    if (nick.toLowerCase() === "donations") return false;

    if (/^\d+$/.test(nick)) return false;

    if (!/[a-zA-Z]/.test(nick)) return false;

    if (typeof value !== "number" || isNaN(value)) return false;

    if (value < 0) return false;

    if (value > 1_000_000) return false;

    return true;
  });

  log("FILTERED_ENTRIES:", filtered.length);

  return filtered;
}