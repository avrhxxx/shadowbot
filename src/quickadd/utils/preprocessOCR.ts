import { ParserType } from "../session/SessionManager";

export function preprocessOCR(
  lines: string[],
  parserType: ParserType
): string[] {
  switch (parserType) {
    case "DUEL_POINTS":
      return preprocessDuelPoints(lines);

    case "DONATIONS":
      return preprocessDonations(lines);

    default:
      return lines;
  }
}

// =====================================
// 🔥 DONATIONS PREPROCESS (NOWE)
// =====================================
function preprocessDonations(lines: string[]): string[] {
  const result: string[] = [];

  for (let line of lines) {
    let cleaned = line.trim();

    if (!cleaned) continue;

    const lower = cleaned.toLowerCase();

    // =========================
    // ❌ WYWAŁ SYSTEM / UI TEXT
    // =========================
    if (
      lower.includes("at least") ||
      lower.includes("required") ||
      lower.includes("total") ||
      lower.includes("ranking") ||
      lower.includes("alliance") ||
      lower.includes("points") ||
      lower.includes("contribution")
    ) {
      continue;
    }

    // =========================
    // 🧹 OCR CLEAN
    // =========================
    cleaned = cleaned
      .replace(/[ÔÇś@%]/g, "")      // śmieci OCR
      .replace(/^\d+\s*/, "")       // "4 Jay..." → "Jay..."
      .replace(/\s+/g, " ")
      .trim();

    // =========================
    // 💰 NORMALIZUJ DONATIONS LINE
    // =========================
    if (/donations/i.test(cleaned)) {
      // usuń wszystko poza "Donations: number"
      const match = cleaned.match(/donations[:\s]*([\d,]+)/i);

      if (match) {
        cleaned = `Donations: ${match[1]}`;
      } else {
        continue;
      }

      result.push(cleaned);
      continue;
    }

    // =========================
    // 🧠 NICKNAME FILTER
    // =========================
    if (/^[a-z0-9 _.'-]{3,}$/i.test(cleaned) && /[a-z]/i.test(cleaned)) {
      result.push(cleaned);
    }
  }

  return result;
}

// =====================================
// 🔥 DUEL POINTS (BEZ ZMIAN)
// =====================================
function preprocessDuelPoints(lines: string[]): string[] {
  const result: string[] = [];

  for (let line of lines) {
    const lower = line.toLowerCase();

    if (
      lower.includes("show my alliance") ||
      lower.includes("ranking") ||
      lower.includes("league") ||
      lower.includes("weekly") ||
      lower.includes("player") ||
      lower.includes("rank")
    ) {
      continue;
    }

    line = line.replace(/^[^\w\d]+/, "");
    line = line.replace(/[^\dMK]+$/i, "");

    if (!/[\d]+/.test(line)) continue;
    if (line.length < 6) continue;

    result.push(line.trim());
  }

  const CUT_FROM_BOTTOM = 4;

  return result.slice(0, Math.max(0, result.length - CUT_FROM_BOTTOM));
}