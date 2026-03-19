import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

export function parseDonations(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  let lastNicknameLine: string | null = null;

  for (const rawLine of lines) {
    if (!rawLine) continue;

    const line = rawLine.trim();
    if (!line) continue;

    const lower = line.toLowerCase();

    // ❌ ignoruj śmieci systemowe
    if (
      lower.includes("required") ||
      lower.includes("rewards") ||
      lower.includes("claim")
    ) {
      continue;
    }

    // 🔥 jeśli NIE ma donations → traktuj jako potencjalny nick
    if (!lower.includes("donations")) {
      lastNicknameLine = line;
      continue;
    }

    // 🔥 mamy linię z Donations → parsujemy value
    const valueMatch = line.match(/([\d,]+)/);
    if (!valueMatch) continue;

    const rawNumber = valueMatch[1];
    const value = normalizeValue(rawNumber);

    if (value <= 0) continue;

    // 🔥 użyj poprzedniej linii jako nicka
    let nickname = lastNicknameLine
      ? cleanNickname(lastNicknameLine)
      : "";

    // fallback (jak OCR coś rozwalił)
    if (!nickname || nickname.length < 3) {
      nickname = "UNKNOWN";
    }

    const isWeird =
      nickname.length < 3 ||
      /^[\d\s]+$/.test(nickname);

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

    // reset (żeby nie brało tego samego nicka kilka razy)
    lastNicknameLine = null;
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