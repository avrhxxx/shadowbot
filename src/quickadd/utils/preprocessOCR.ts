import { ParserType } from "../session/SessionManager";

export function preprocessOCR(
  lines: string[],
  parserType: ParserType
): string[] {
  switch (parserType) {
    case "DUEL_POINTS":
      return preprocessDuelPoints(lines);

    default:
      return lines;
  }
}

// 🔥 DUEL POINTS FIX (usuniecie zielonego usera + śmieci)
function preprocessDuelPoints(lines: string[]): string[] {
  const result: string[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();

    // 🔥 filtr UI / śmieci OCR
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

    // 🔥 wywal totalne śmieci
    if (line.length < 6) continue;

    result.push(line);
  }

  // 🔥 NAJWAŻNIEJSZE:
  // usuwamy dół gdzie jest highlight user (zielony)
  // sprawdzone — to zawsze dół
  const CUT_FROM_BOTTOM = 4;

  return result.slice(0, result.length - CUT_FROM_BOTTOM);
}