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
export function parseByType(
  type: ParserType | null,
  lines: string[]
): QuickAddEntry[] {
  if (!type) return [];

  let entries: QuickAddEntry[] = [];

  log("TYPE:", type);
  log("LINES:", lines.length);

  try {
    switch (type) {
      case "DONATIONS":
        entries = parseDonations(lines);
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

    // ❌ nick invalid
    if (!nick || nick.length < 2) return false;

    // ❌ system text
    if (nick.toLowerCase() === "donations") return false;

    // ❌ numeric nick (OCR bug)
    if (/^\d+$/.test(nick)) return false;

    // ❌ garbage nick (np. "lIl", "O0O")
    if (!/[a-zA-Z]/.test(nick)) return false;

    // ❌ value invalid
    if (typeof value !== "number" || isNaN(value)) return false;

    // ❌ negative
    if (value < 0) return false;

    // ❌ unrealistic (anti OCR)
    if (value > 1_000_000) return false;

    return true;
  });

  log("FILTERED_ENTRIES:", filtered.length);

  return filtered;
}