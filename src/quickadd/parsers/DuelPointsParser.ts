import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

export function parseDuelPoints(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  for (const rawLine of lines) {
    if (!rawLine) continue;

    let line = rawLine.trim();
    if (!line) continue;

    // 🔥 MUSI zawierać M lub K (to są punkty)
    const valueMatch = line.match(/([\d.,]+)\s*([MK])/i);
    if (!valueMatch) continue;

    const fullMatch = valueMatch[0];
    const rawNumber = valueMatch[1];
    const suffix = valueMatch[2].toUpperCase();

    const value = normalizeValue(rawNumber, suffix);
    if (value <= 0) continue;

    // 🔥 usuń wartość z linii
    let nicknamePart = line.replace(fullMatch, "");

    // 🔥 usuń rank z początku (np. "8 ", "10 ")
    nicknamePart = nicknamePart.replace(/^\d+\s*/, "");

    // 🔥 usuń śmieciowe znaki OCR
    const nickname = cleanNickname(nicknamePart);

    if (!nickname || nickname.length < 3) continue;

    entries.push({
      lineId: lineCounter++,
      nickname,
      value,
      raw: fullMatch,
      status: "OK",
      confidence: 1,
      sourceType: "OCR",
    });
  }

  return entries;
}

// 🔥 "36.59M" → 36590000
function normalizeValue(num: string, suffix: string): number {
  const clean = num.replace(",", ".");
  const number = parseFloat(clean);

  if (isNaN(number)) return 0;

  if (suffix === "M") return Math.round(number * 1_000_000);
  if (suffix === "K") return Math.round(number * 1_000);

  return 0;
}

// 🔥 czyszczenie nicków (MEGA ważne)
function cleanNickname(name: string): string {
  return (
    name
      // usuń dziwne OCR znaki
      .replace(/[^\w\d\s_]/g, "")
      // usuń wielokrotne spacje
      .replace(/\s+/g, " ")
      .trim()
  );
}