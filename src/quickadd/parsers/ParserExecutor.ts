// src/quickadd/parsers/ParserExecutor.ts

import { ParserType } from "../session/SessionManager";
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

  switch (type) {
    case "DONATIONS":
      return parseDonations(lines);

    case "DUEL_POINTS":
      return parseDuelPoints(lines);

    case "RR_RAID":
      return parseReservoirRaid(lines);

    case "RR_ATTENDANCE":
      return parseReservoirAttendance(lines);

    default:
      return [];
  }
}