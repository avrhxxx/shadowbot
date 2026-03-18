import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

export function parseReservoirRaid(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  for (const rawLine of lines) {
    if (!rawLine) continue;

    const line = rawLine.trim();
    if (!line) continue;

    const match =
      line.match(/\(No\s*Team\)\s*(.+)/i) ||
      line.match(/\(NoTeam\)\s*(.+)/i) ||
      line.match(/No\s*Team\)?\s*(.+)/i);

    if (!match) continue;

    const nickname = match[1].trim();
    if (!nickname) continue;

    entries.push(createEntry(rawLine, nickname, 1, "RAID"));
  }

  return entries;
}

function createEntry(
  rawText: string,
  nickname: string,
  value: number,
  raw: string
): QuickAddEntry {
  return {
    lineId: lineCounter++,
    rawText,
    nickname,
    value,
    raw,
    status: "OK",
    confidence: 1,
    sourceType: "OCR",
  };
}