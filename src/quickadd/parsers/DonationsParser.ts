import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

export function parseDonations(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  for (const rawLine of lines) {
    if (!rawLine) continue;

    let line = rawLine.trim();
    if (!line) continue;

    // 🔥 musi zawierać "donations"
    if (!line.toLowerCase().includes("donations")) continue;

    // 🔥 wyciągnij liczbę (np. 82,969)
    const valueMatch = line.match(/([\d,]+)/);
    if (!valueMatch) continue;

    const rawNumber = valueMatch[1];
    const value = normalizeValue(rawNumber);
    if (value <= 0) continue;

    // 🔥 usuń "Donations: 82,969"
    let nicknamePart = line
      .replace(/donations[:\s]*/i, "")
      .replace(rawNumber, "");

    // 🔥 usuń śmieci OCR z początku
    nicknamePart = nicknamePart.replace(/^[^a-zA-Z0-9_]+/, "");

    const cleaned = cleanNickname(nicknamePart);

    // 🔥 heurystyka jakości
    const isWeird =
      cleaned.length < 3 ||
      /^[\d\s]+$/.test(cleaned);

    if (!cleaned) continue;

    entries.push({
      lineId: lineCounter++,
      nickname: cleaned,
      value,
      raw: rawNumber,
      rawText: rawLine,
      status: isWeird ? "UNREADABLE" : "OK",
      confidence: isWeird ? 0.5 : 1,
      sourceType: "OCR",
    });
  }

  return entries;
}

// 🔥 "82,969" → 82969
function normalizeValue(num: string): number {
  const clean = num.replace(/,/g, "");
  const parsed = parseInt(clean, 10);

  if (isNaN(parsed)) return 0;
  return parsed;
}

// 🔥 czyszczenie nicków
function cleanNickname(name: string): string {
  return name
    .replace(/[^\w\d\s_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}