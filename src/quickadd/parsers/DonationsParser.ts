import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

export function parseDonations(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  for (const rawLine of lines) {
    if (!rawLine) continue;

    const line = rawLine.trim();
    if (!line) continue;

    const lower = line.toLowerCase();

    // ❌ wywal zdania systemowe
    if (
      lower.includes("required") ||
      lower.includes("rewards") ||
      lower.includes("claim")
    ) {
      continue;
    }

    // 🔥 musi mieć "donations"
    if (!lower.includes("donations")) continue;

    // 🔥 rozbij na 2 części
    const parts = line.split(/donations[:\s]*/i);

    if (parts.length < 2) continue;

    const nicknamePart = parts[0];
    const valuePart = parts[1];

    // 🔥 znajdź liczbę PO donations
    const valueMatch = valuePart.match(/([\d,]+)/);
    if (!valueMatch) continue;

    const rawNumber = valueMatch[1];
    const value = normalizeValue(rawNumber);

    if (value <= 0) continue;

    // 🔥 wyczyść nick (ważne — bierzemy LEWĄ stronę)
    let nickname = cleanNickname(nicknamePart);

    // usuń rank (np. "4 ", "5 ")
    nickname = nickname.replace(/^\d+\s*/, "");

    // usuń śmieci typu "@ @"
    nickname = nickname.replace(/^[^a-zA-Z0-9_]+/, "");

    const isWeird =
      nickname.length < 3 ||
      /^[\d\s]+$/.test(nickname);

    if (!nickname) continue;

    entries.push({
      lineId: lineCounter++,
      nickname,
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