import { parseReservoirRaid } from "./ReservoirRaidParser";
import { parseReservoirAttendance } from "./ReservoirAttendanceParser";
import { parseDonations } from "./DonationsParser";
import { parseDuelPoints } from "./DuelPointsParser";

export type QuickAddParserType =
  | "RR_RAID"
  | "RR_ATTENDANCE"
  | "DONATIONS"
  | "DUEL_POINTS";

export const parserMap = {
  RR_RAID: parseReservoirRaid,
  RR_ATTENDANCE: parseReservoirAttendance,
  DONATIONS: parseDonations,
  DUEL_POINTS: parseDuelPoints,
};