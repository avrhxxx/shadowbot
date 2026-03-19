import { parseReservoirRaid, canParseRaid } from "./ReservoirRaidParser";
import { parseReservoirAttendance, canParseAttendance } from "./ReservoirAttendanceParser";
import { parseDonations, canParseDonations } from "./DonationsParser";
import { parseDuelPoints, canParseDuel } from "./DuelPointsParser";
import { QuickAddEntry } from "../types/QuickAddEntry";

type ParserDef = {
  name: string;
  canParse: (lines: string[]) => boolean;
  parse: (lines: string[]) => QuickAddEntry[];
};

const parsers: ParserDef[] = [
  {
    name: "DONATIONS",
    canParse: canParseDonations,
    parse: parseDonations,
  },
  {
    name: "DUEL_POINTS",
    canParse: canParseDuel,
    parse: parseDuelPoints,
  },
  {
    name: "RR_RAID",
    canParse: canParseRaid,
    parse: parseReservoirRaid,
  },
  {
    name: "RR_ATTENDANCE",
    canParse: canParseAttendance,
    parse: parseReservoirAttendance,
  },
];

export function parseByImageType(lines: string[]): QuickAddEntry[] {
  for (const parser of parsers) {
    try {
      if (!parser.canParse(lines)) continue;

      const result = parser.parse(lines);

      // 🔥 klucz: musi coś znaleźć
      if (result && result.length > 0) {
        console.log(`✅ Parsed as ${parser.name}`);
        return result;
      }
    } catch (err) {
      console.error(`Parser ${parser.name} failed`, err);
    }
  }

  console.log("❌ No parser matched");
  return [];
}