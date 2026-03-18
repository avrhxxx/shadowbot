import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

export function parseReservoirAttendance(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  for (const rawLine of lines) {
    if (!rawLine) continue;

    let line = rawLine.trim();
    if (!line) continue;

    // usuń rank
    line = line.replace(/^\d+\s*/, "");

    // usuń value na końcu
    line = line.replace(/[\d,]+$/, "");

    const nickname = line.trim();
    if (!nickname) continue;

    entries.push({
      lineId: lineCounter++,
      rawText: rawLine,
      nickname,
      value: "",
      status: "OK",
      confidence: 1,
      sourceType: "OCR",
    });
  }

  return entries;
}