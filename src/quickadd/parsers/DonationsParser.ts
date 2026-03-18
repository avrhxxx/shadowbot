import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

export function parseDonations(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  for (const rawLine of lines) {
    if (!rawLine) continue;

    let line = rawLine.trim();
    if (!line) continue;

    const lower = line.toLowerCase();

    // 🔥 musi zawierać "donations"
    if (!lower.includes("donations")) continue;

    // 🔥 wyciągnij wartość (np. 82,969)
    const valueMatch = line.match(/donations[:\s]*([\d,]+)/i);
    if (!valueMatch) continue;

    const rawNumber = valueMatch[1];
    const value = parseNumber(rawNumber);

    if (value <= 0) continue;

    // 🔥 usuń "Donations: xxx"
    let nicknamePart = line.replace(/donations[:\s]*[\d,]+/i, "");

    // 🔥 usuń śmieci OCR na początku (np. @, %, itp.)
    nicknamePart = nicknamePart.replace(/^[^\w\d]+/, "");

    const nickname = cleanNickname(nicknamePart);

    if (!nickname || nickname.length < 3) continue;

    entries.push({
      lineId: lineCounter++,
      nickname,
      value,
      raw: rawNumber,
      status: "OK",
      confidence: 1,
      sourceType: "OCR",
    });
  }

  return entries;
}

// 🔥 "82,969" → 82969
function parseNumber(num: string): number {
  const clean = num.replace(/,/g, "");
  const parsed = parseInt(clean, 10);
  return isNaN(parsed) ? 0 : parsed;
}

// 🔥 czyszczenie nicków (ważne przy OCR)
function cleanNickname(name: string): string {
  return (
    name
      // usuń dziwne znaki OCR
      .replace(/[^\w\d\s_]/g, "")
      // usuń wielokrotne spacje
      .replace(/\s+/g, " ")
      .trim()
  );
}