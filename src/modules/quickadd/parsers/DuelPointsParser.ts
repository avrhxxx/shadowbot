// src/modules/quickadd/parsers/DuelPointsParser.ts

import { QuickAddEntry } from "../types/QuickAddEntry";

/**
 * Parser dla Duel Points
 * Przykład:
 * #227 [XXX] RavenBritt
 * 68.38M
 */
export function parseDuelPoints(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  let lineId = 1;

  for (let i = 0; i < lines.length; i += 2) {
    const rawNick = lines[i];
    const value = lines[i + 1];

    if (!rawNick || !value) continue;

    // usuwa ranking i tag [XXX]
    const nickname = rawNick
      .replace(/^#\d+\s*/, "")
      .replace(/\[.*?\]\s*/, "")
      .trim();

    entries.push({
      lineId: lineId++,
      rawText: `${rawNick} ${value}`,
      nickname,
      value: value.trim(),
      status: "OK",
      confidence: 100,
    });
  }

  return entries;
}