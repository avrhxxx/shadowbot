import { detectParserType } from "./detectParserType";
import { parseReservoirRaid } from "./parseReservoirRaid";
import { parseReservoirAttendance } from "./parseReservoirAttendance";
import { parseDonations } from "./parseDonations";
import { parseDuelPoints } from "./parseDuelPoints";
import { QuickAddEntry } from "../types/QuickAddEntry";

export function parseByType(lines: string[]): QuickAddEntry[] {
  const type = detectParserType(lines);

  console.log("📸 Detected parser:", type);

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
      console.log("❌ Unknown screenshot — skipped");
      return [];
  }
}