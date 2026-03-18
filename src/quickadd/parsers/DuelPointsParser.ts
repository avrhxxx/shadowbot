import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

export function parseDuelPoints(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  for (const rawLine of lines) {
    if (!rawLine) continue;

    let line = rawLine.trim();
    if (!line) continue;

    // 🔥 znajdź liczbę (NIE musi być na końcu)
    const valueMatch = line.match(/([\d.,]+)\s*([MK]?)/i);
    if (!valueMatch) continue;

    const rawNumber = valueMatch[1];
    const suffix = (valueMatch[2] || "").toUpperCase();

    const value = normalizeValue(rawNumber, suffix);

    // 🔥 usuń wartość z linii → zostaje nick
    const nicknameRaw = line.replace(valueMatch[0], "").trim();
    const nickname = cleanNickname(nicknameRaw);

    if (!nickname || value <= 0) continue;

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

// 🔹 czyści nickname
function cleanNickname(name: string): string {
  return name.replace(/[^\w\d_ ]/g, "").trim();
}