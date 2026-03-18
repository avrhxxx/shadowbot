import { QuickAddEntry } from "../types/QuickAddEntry";

export function parseDonations(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine) continue;

    let line = rawLine.trim();
    if (!line) continue;

    // 🔹 CASE 1: "1 Nickname"
    const rankMatch = line.match(/^\d+\s*(.+)/);

    if (rankMatch) {
      const nickname = cleanNickname(rankMatch[1]);

      let value = 0;
      let raw = "";

      const nextLine = lines[i + 1]?.trim();

      if (nextLine) {
        const valueMatch =
          nextLine.match(/Donations[:\s]*([\d,.\s]+)/i) ||
          nextLine.match(/([\d,]{3,})/);

        if (valueMatch) {
          value = normalizeNumber(valueMatch[1]);
          raw = valueMatch[1];
          i++; // skip next line
        }
      }

      if (nickname && value > 0) {
        entries.push({
          nickname,
          value,
          raw,
        });
      }

      continue;
    }

    // 🔥 CASE 2: "1 Nickname 123,456"
    const mergedMatch = line.match(/^\d+\s*([^\d]+?)\s+.*?([\d,]{3,})/);

    if (mergedMatch) {
      const nickname = cleanNickname(mergedMatch[1]);
      const value = normalizeNumber(mergedMatch[2]);

      if (nickname && value > 0) {
        entries.push({
          nickname,
          value,
          raw: mergedMatch[2],
        });
      }
    }
  }

  return entries;
}

// 🔹 usuwa śmieci z OCR
function cleanNickname(name: string): string {
  return name.replace(/[^\w\d_]/g, "").trim();
}

// 🔹 zamienia "123,456" → 123456
function normalizeNumber(value: string): number {
  const clean = value.replace(/[^\d]/g, "");
  return parseInt(clean, 10) || 0;
}