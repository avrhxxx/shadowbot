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
    if (!nickname) continue;

    entries.push({
      lineId: lineCounter++,
      rawText: rawLine,
      nickname,
      value,
      status: "OK",
      confidence: 1,
      sourceType: "OCR",
    });
  }

  return entries;
}

function normalizeValue(num: string, suffix: string): string {
  let clean = num.replace(",", ".");

  const number = parseFloat(clean);
  if (isNaN(number)) return "";

  if (suffix === "M") return Math.round(number * 1_000_000).toString();
  if (suffix === "K") return Math.round(number * 1_000).toString();

  return num.replace(/[^\d]/g, "");
}