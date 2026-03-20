// src/quickadd/parsers/parserMap.ts
import { parseReservoirRaid } from "./ReservoirRaidParser";
import { parseReservoirAttendance } from "./ReservoirAttendanceParser";
import { parseDonations } from "./DonationsParser";
import { parseDuelPoints } from "./DuelPointsParser";
import { QuickAddEntry } from "../types/QuickAddEntry";

export type QuickAddParserType =
  | "RR_RAID"
  | "RR_ATTENDANCE"
  | "DONATIONS"
  | "DUEL_POINTS";

// 🔥 KLUCZOWE — typ parsera
type Parser = (lines: string[]) => QuickAddEntry[];

export const parserMap: Record<QuickAddParserType, Parser> = {
  RR_RAID: parseReservoirRaid,
  RR_ATTENDANCE: parseReservoirAttendance,
  DONATIONS: parseDonations,
  DUEL_POINTS: parseDuelPoints,
};