// src/modules/quickadd/parsers/ReservoirRaidParser.ts

import { QuickAddEntry } from "../types/QuickAddEntry";

/**
 * Parser dla Reservoir Raid
 * Format:
 * Nickname
 * Score
 */
export function parseReservoirRaid(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  let lineId = 1;

  for (let i = 0; i < lines.length; i += 2) {
    const nickname = lines[i]?.trim();
    const value = lines[i + 1]?.trim();

    if (!nickname || !value) continue;

    entries.push({
      lineId: lineId++,
      rawText: `${nickname} ${value}`,
      nickname,
      value,
      status: "OK",
      confidence: 100,
    });
  }

  return entries;
}