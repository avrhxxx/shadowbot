import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

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
      const nickname = rankMatch[1].trim();

      let value = 0;
      let raw = "";

      const nextLine = lines[i + 1]?.trim();

      if (nextLine) {
        const valueMatch =
          nextLine.match(/Donations[:\s]*([\d,.\s]+)/i) ||
          nextLine.match(/([\d,]{3,})/);

        if (valueMatch) {
          raw = valueMatch[1];
          value = normalizeNumber(raw);
          i++; // skip next line
        }
      }

      if (nickname && value > 0) {
        entries.push(createEntry(rawLine, nickname, value, raw));
      }

      continue;
    }

    // 🔥 CASE 2: merged line
    const mergedMatch = line.match(/^\d+\s*([^\d]+?)\s+.*?([\d,]{3,})/);

    if (mergedMatch) {
      const nickname = mergedMatch[1].trim();
      const raw = mergedMatch[2];
      const value = normalizeNumber(raw);

      if (nickname && value > 0) {
        entries.push(createEntry(rawLine, nickname, value, raw));
      }
    }
  }

  return entries;
}

function normalizeNumber(value: string): number {
  return parseInt(value.replace(/[^\d]/g, ""), 10) || 0;
}

function createEntry(
  rawText: string,
  nickname: string,
  value: number,
  raw: string
): QuickAddEntry {
  return {
    lineId: lineCounter++,
    rawText,
    nickname,
    value,
    raw,
    status: "OK",
    confidence: 1,
    sourceType: "OCR",
  };
}