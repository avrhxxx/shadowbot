import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

export function parseReservoirRaid(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  for (const rawLine of lines) {
    if (!rawLine) continue;

    const line = rawLine.trim();

    const match =
      line.match(/\(No\s*Team\)\s*(.+)/i) ||
      line.match(/\(NoTeam\)\s*(.+)/i) ||
      line.match(/No\s*Team\)?\s*(.+)/i); // fallback OCR

    if (!match) continue;

    const nickname = match[1].trim();
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