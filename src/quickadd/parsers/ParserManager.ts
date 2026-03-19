import { parseReservoirRaid } from "./ReservoirRaidParser";
import { parseReservoirAttendance } from "./ReservoirAttendanceParser";
import { parseDonations } from "./DonationsParser";
import { parseDuelPoints } from "./DuelPointsParser";
import { QuickAddEntry } from "../types/QuickAddEntry";

type ParserResult = {
  type: string;
  entries: QuickAddEntry[];
};

// 🔥 KOLEJNOŚĆ MA ZNACZENIE
const parsers = [
  { type: "DONATIONS", fn: parseDonations },
  { type: "DUEL_POINTS", fn: parseDuelPoints },
  { type: "RR_RAID", fn: parseReservoirRaid },
  { type: "RR_ATTENDANCE", fn: parseReservoirAttendance },
];

export function parseByImageType(lines: string[]): QuickAddEntry[] {
  for (const parser of parsers) {
    const result = parser.fn(lines);

    console.log(`Trying parser: ${parser.type}, entries: ${result.length}`);

    if (result && result.length > 0) {
      console.log(`✅ MATCHED: ${parser.type}`);
      return result;
    }
  }

  console.log("❌ No parser matched");
  return [];
}