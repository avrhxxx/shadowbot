import {
  parseReservoirRaid,
  canParseReservoirRaid,
} from "./ReservoirRaidParser";

import {
  parseReservoirAttendance,
  canParseReservoirAttendance,
} from "./ReservoirAttendanceParser";

import {
  parseDonations,
  canParseDonations,
} from "./DonationsParser";

import {
  parseDuelPoints,
  canParseDuelPoints,
} from "./DuelPointsParser";

import { QuickAddEntry } from "../types/QuickAddEntry";

// 🔥 KOLEJNOŚĆ MA OGROMNE ZNACZENIE
const parsers = [
  {
    type: "DONATIONS",
    canParse: canParseDonations,
    parse: parseDonations,
  },
  {
    type: "DUEL_POINTS",
    canParse: canParseDuelPoints,
    parse: parseDuelPoints,
  },
  {
    type: "RR_RAID",
    canParse: canParseReservoirRaid,
    parse: parseReservoirRaid,
  },
  {
    type: "RR_ATTENDANCE",
    canParse: canParseReservoirAttendance,
    parse: parseReservoirAttendance,
  },
];

export function parseByImageType(lines: string[]): QuickAddEntry[] {
  for (const parser of parsers) {
    const canParse = parser.canParse(lines);

    console.log(`Trying parser: ${parser.type}, canParse: ${canParse}`);

    if (!canParse) continue;

    const result = parser.parse(lines);

    console.log(
      `➡️ Parsing with: ${parser.type}, entries: ${result.length}`
    );

    if (result && result.length > 0) {
      console.log(`✅ MATCHED: ${parser.type}`);
      return result;
    }

    console.log(`⚠️ ${parser.type} passed canParse but returned 0 entries`);
  }

  console.log("❌ No parser matched");
  return [];
}