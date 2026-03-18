import { QuickAddEntry } from "../types/QuickAddEntry";

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

    const nicknameRaw = line.replace(fullMatch, "").trim();
    const nickname = cleanNickname(nicknameRaw);

    if (!nickname || value <= 0) continue;

    entries.push({
      nickname,
      value: String(value), // 🔥 FIX
      raw: fullMatch,
    });
  }

  return entries;
}

function normalizeValue(num: string, suffix: string): number {
  const clean = num.replace(",", ".");
  const number = parseFloat(clean);

  if (isNaN(number)) return 0;

  if (suffix === "M") return Math.round(number * 1_000_000);
  if (suffix === "K") return Math.round(number * 1_000);

  return parseInt(num.replace(/[^\d]/g, ""), 10) || 0;
}

function cleanNickname(name: string): string {
  return name.replace(/[^\w\d_]/g, "").trim();
}