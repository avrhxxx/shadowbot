// src/modules/quickadd/parsers/DonationsParser.ts

import { QuickAddEntry } from "../types/QuickAddEntry";

/**
 * Parser dla Donations
 * Format:
 * Nickname Donations: value
 * lub:
 * Nickname value
 */
export function parseDonations(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];
  let lineId = 1;

  for (const line of lines) {
    if (!line) continue;

    const parts = line.trim().split(" ");
    if (parts.length < 2) continue;

    const value = parts.pop(); // ostatni token = wartość
    const nickname = parts.join(" ");

    entries.push({
      lineId: lineId++,
      rawText: line,
      nickname,
      value: value!,
      status: "OK",
      confidence: 100,
    });
  }

  return entries;
}