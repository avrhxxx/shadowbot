import { QuickAddEntry } from "../types/QuickAddEntry";
import { analyzeEntry } from "../utils/ocrWarnings";

let lineCounter = 1;

export function parseDuelPoints(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  for (const rawLine of lines) {
    if (!rawLine) continue;

    let line = rawLine.trim();
    if (!line) continue;

    // 🔥 musi mieć M/K
    const valueMatch = line.match(/([\d.,]+)\s*([MK])/i);
    if (!valueMatch) continue;

    const fullMatch = valueMatch[0];
    const rawNumber = valueMatch[1];
    const suffix = valueMatch[2].toUpperCase();

    const value = normalizeValue(rawNumber, suffix);
    if (value <= 0) continue;

    // 🔥 usuń value
    let nicknamePart = line.replace(fullMatch, "");

    // 🔥 usuń rank
    nicknamePart = nicknamePart.replace(/^\d+\s*/, "");

    const nickname = cleanNickname(nicknamePart);

    if (!nickname || nickname.length < 3) continue;

    // 🔥 ANALIZA (GLOBALNY HELPER)
    const analysis = analyzeEntry(nickname, value);

    entries.push({
      lineId: lineCounter++,
      nickname,
      value,
      raw: fullMatch,
      status: analysis.suspicious ? "SUS" : "OK",
      confidence: analysis.confidence,
      sourceType: "OCR",
    });
  }

  return entries;
}

// =========================
// 🔢 VALUE
// =========================
function normalizeValue(num: string, suffix: string): number {
  const clean = num.replace(",", ".");
  const number = parseFloat(clean);

  if (isNaN(number)) return 0;

  if (suffix === "M") return Math.round(number * 1_000_000);
  if (suffix === "K") return Math.round(number * 1_000);

  return 0;
}

// =========================
// 🧼 CLEAN NICK
// =========================
function cleanNickname(name: string): string {
  return (
    name
      .replace(/[^\w\d\s_]/g, "")
      .replace(/^[A-Za-z]\s+/, "") // "E Lady" → "Lady"
      .replace(/\s+/g, " ")
      .replace(/\b([A-Za-z])\s+([A-Za-z]{1,2})\b/g, "$1$2") // "M oK" → "MoK"
      .trim()
  );
}