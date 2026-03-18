import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

export function parseDuelPoints(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  for (const rawLine of lines) {
    if (!rawLine) continue;

    const line = rawLine.trim();
    if (!line) continue;

    const valueMatch = line.match(/([\d.,]+)\s*([MK]?)/i);
    if (!valueMatch) continue;

    const fullMatch = valueMatch[0];

    if (!line.endsWith(fullMatch)) continue;

    const rawNumber = valueMatch[1];
    const suffix = (valueMatch[2] || "").toUpperCase();

    const value = normalizeValue(rawNumber, suffix);

    const nickname = line.replace(fullMatch, "").trim();
    if (!nickname || value <= 0) continue;

    entries.push(createEntry(rawLine, nickname, value, fullMatch));
  }

  return entries;
}

function normalizeValue(num: string, suffix: string): number {
  const clean = num.replace(",", ".");
  const number = parseFloat(clean);

  if (isNaN(number)) return 0;

  if (suffix === "M") return Math.round(number * 1_000_000);
  if (suffix === "K") return Math.round(number * 1_000);

  return parseInt(num.replace(/[^\d]/g, ""), 10) || 0;
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