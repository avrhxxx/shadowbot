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
// 🔥 DONATIONS PREPROCESS (FINAL)
// =====================================
function preprocessDonations(lines: string[]): string[] {
  const result: string[] = [];

  for (let line of lines) {
    if (!line) continue;

    let cleaned = line
      .replace(/[ÔÇś@%*_=~`"'|\\]/g, "")   // OCR garbage
      .replace(/^\d+\s*/, "")              // "4 Nick" → "Nick"
      .replace(/^[^\w]+/, "")              // leading junk
      .replace(/[^\w\d]+$/g, "")           // trailing junk
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned) continue;

    const lower = cleaned.toLowerCase();

    // ❌ remove UI/system text
    if (
      lower.includes("at least") ||
      lower.includes("required") ||
      lower.includes("total") ||
      lower.includes("ranking") ||
      lower.includes("alliance") ||
      lower.includes("points") ||
      lower.includes("contribution") ||
      lower.includes("reward")
    ) {
      continue;
    }

    // 💰 normalize donations
    if (/donations/i.test(cleaned)) {
      const match = cleaned.match(/donations[:\s]*([\d,]+)/i);
      if (!match) continue;

      result.push(`Donations: ${match[1]}`);
      continue;
    }

    // 🧠 keep only valid nick candidates
    if (
      cleaned.length >= 3 &&
      /[a-z]/i.test(cleaned) &&
      !/donations/i.test(cleaned)
    ) {
      result.push(cleaned);
    }
  }

  return result;
}

// =====================================
// 🔥 DUEL POINTS (unchanged)
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