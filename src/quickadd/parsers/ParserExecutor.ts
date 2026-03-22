// src/quickadd/parsers/ParserExecutor.ts

import { ParserType } from "../session/sessionStore";
import { QuickAddEntry } from "../types/QuickAddEntry";

import { parseDonations } from "./DonationsParser";
import { parseDuelPoints } from "./DuelPointsParser";
import { parseReservoirRaid } from "./ReservoirRaidParser";
import { parseReservoirAttendance } from "./ReservoirAttendanceParser";

export function parseByType(
  type: ParserType | null,
  lines: string[]
): QuickAddEntry[] {
  if (!type) return [];

  let entries: QuickAddEntry[] = [];

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
  } catch {
    return [];
  }

  return entries.filter(e => {
    const nick = e.nickname?.trim();
    if (!nick || nick.length < 2) return false;
    if (nick.toLowerCase() === "donations") return false;
    if (typeof e.value !== "number" || isNaN(e.value)) return false;
    if (e.value < 0) return false;
    return true;
  });
}