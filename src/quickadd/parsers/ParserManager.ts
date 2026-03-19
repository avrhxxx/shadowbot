import { detectParserType } from "./detectParserType";
import { parseReservoirRaid } from "./ReservoirRaidParser";
import { parseReservoirAttendance } from "./ReservoirAttendanceParser";
import { parseDonations } from "./DonationsParser";
import { parseDuelPoints } from "./DuelPointsParser";
import { QuickAddEntry } from "../types/QuickAddEntry";

export function parseByImageType(lines: string[]): QuickAddEntry[] {
  const type = detectParserType(lines);

  switch (type) {
    case "RR_RAID":
      return parseReservoirRaid(lines);

    case "RR_ATTENDANCE":
      return parseReservoirAttendance(lines);

    case "DONATIONS":
      return parseDonations(lines);

    case "DUEL_POINTS":
      return parseDuelPoints(lines);

    default:
      return [];
  }
}