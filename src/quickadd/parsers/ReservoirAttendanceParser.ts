import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

export function parseReservoirAttendance(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  for (const rawLine of lines) {
    if (!rawLine) continue;

    let line = rawLine.trim();
    if (!line) continue;

    line = line.replace(/^\d+\s*/, "");
    line = line.replace(/[\d,]+$/, "");

    const nickname = line.trim();
    if (!nickname) continue;

    entries.push(createEntry(rawLine, nickname, 1, "ATTEND"));
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