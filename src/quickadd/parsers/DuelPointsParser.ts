import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

export function parseDuelPoints(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  for (const rawLine of lines) {
    if (!rawLine) continue;

    let line = rawLine.trim();
    if (!line) continue;

    // 🔥 znajdź wartość (np. 36.59M / 500K / 123456)
    const valueMatch = line.match(/([\d.,]+)\s*([MK]?)/i);
    if (!valueMatch) continue;

    const rawNumber = valueMatch[1];
    const suffix = (valueMatch[2] || "").toUpperCase();

    const value = normalizeValue(rawNumber, suffix);

    // 🔥 wyciągnij nickname (usuń value + rank + tagi)
    let nicknameRaw = line
      .replace(valueMatch[0], "")         // usuń value
      .replace(/^\d+\s*/, "")             // usuń rank (np. "9 ")
      .replace(/#\d+\s*\[.*?\]/, "")      // usuń "#227 [XXX]"
      .trim();

    const nickname = cleanNickname(nicknameRaw);

    // 🔥 filtr śmieci OCR
    if (!nickname || nickname.length < 3) continue;
    if (value <= 0) continue;

    entries.push({
      lineId: lineCounter++,
      nickname,
      value,
      raw: valueMatch[0],
      status: "OK",
      confidence: 1,
      sourceType: "OCR",
    });
  }

  return entries;
}

// 🔹 "1.2M" → 1200000
function normalizeValue(num: string, suffix: string): number {
  const clean = num.replace(",", ".");
  const number = parseFloat(clean);

  if (isNaN(number)) return 0;

  if (suffix === "M") return Math.round(number * 1_000_000);
  if (suffix === "K") return Math.round(number * 1_000);

  return parseInt(num.replace(/[^\d]/g, ""), 10) || 0;
}

// 🔹 czyści nickname z OCR śmieci
function cleanNickname(name: string): string {
  return name
    .replace(/[^\w\d_ ]/g, "") // usuń dziwne znaki
    .replace(/\s{2,}/g, " ")   // usuń podwójne spacje
    .trim();
}