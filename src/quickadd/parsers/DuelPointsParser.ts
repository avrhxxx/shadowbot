import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

export function parseDuelPoints(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  for (const rawLine of lines) {
    if (!rawLine) continue;

    let line = rawLine.trim();
    if (!line) continue;

    // 🔥 musi zawierać wartość typu 36.59M / 1200K
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

    // 🔥 czyszczenie nicku
    const cleaned = cleanNickname(nicknamePart);

    // 🔥 heurystyka — wykrywanie śmieci OCR
    const isWeird =
      cleaned.length < 3 ||
      /^[\d\s]+$/.test(cleaned) ||
      cleaned.split(" ").length > 4;

    if (!cleaned) continue;

    entries.push({
      lineId: lineCounter++,
      nickname: cleaned,
      value,
      raw: fullMatch,
      rawText: rawLine,
      status: isWeird ? "UNREADABLE" : "OK", // ✅ FIX (było SUS)
      confidence: isWeird ? 0.4 : 1,
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

// 🔥 czyszczenie nicków
function cleanNickname(name: string): string {
  return name
    .replace(/[^\w\d\s_]/g, "") // usuwa śmieci OCR
    .replace(/\s+/g, " ")
    .trim();
}