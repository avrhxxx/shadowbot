import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

export function parseDonations(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine) continue;

    let line = rawLine.trim();
    if (!line) continue;

    // 🔹 CASE 1: standard (linia z rankiem)
    const rankMatch = line.match(/^\d+\s*(.+)/);

    if (rankMatch) {
      let nickname = rankMatch[1].trim();

      let value = "";
      const nextLine = lines[i + 1]?.trim();

      if (nextLine) {
        const valueMatch =
          nextLine.match(/Donations[:\s]*([\d,.\s]+)/i) ||
          nextLine.match(/([\d,]{3,})/);

        if (valueMatch) {
          value = normalizeNumber(valueMatch[1]);
          i++; // skip next line
        }
      }

      entries.push({
        lineId: lineCounter++,
        rawText: rawLine,
        nickname,
        value,
        status: value ? "OK" : "INVALID",
        confidence: value ? 1 : 0.5,
        sourceType: "OCR",
      });

      continue;
    }

    // 🔥 CASE 2: merged line
    const mergedMatch = line.match(/^\d+\s*([^\d]+?)\s+.*?([\d,]{3,})/);

    if (mergedMatch) {
      const nickname = mergedMatch[1].trim();
      const value = normalizeNumber(mergedMatch[2]);

      entries.push({
        lineId: lineCounter++,
        rawText: rawLine,
        nickname,
        value,
        status: "OK",
        confidence: 0.8,
        sourceType: "OCR",
      });
    }
  }

  return entries;
}

function normalizeNumber(value: string): string {
  return value.replace(/[^\d]/g, "");
}