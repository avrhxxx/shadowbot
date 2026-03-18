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

// 🔥 KLUCZOWA FUNKCJA
function preprocessDuelPoints(lines: string[]): string[] {
  // ❗ usuwamy dolny "highlight user"
  // zakładamy że jest zawsze w dolnej części

  const result: string[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase();

    // 🔥 filtr śmieci OCR
    if (
      lower.includes("show my alliance") ||
      lower.includes("ranking") ||
      lower.includes("league") ||
      lower.includes("weekly") ||
      lower.includes("player")
    ) {
      continue;
    }

    // 🔥 usuń dziwne krótkie linie
    if (line.length < 5) continue;

    result.push(line);
  }

  // 🔥 NAJWAŻNIEJSZE:
  // obcinamy dolne X linii (tam jest user highlight)
  const MAX_LINES = 15;

  return result.slice(0, MAX_LINES);
}