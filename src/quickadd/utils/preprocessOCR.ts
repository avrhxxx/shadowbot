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

// 🔥 DUEL POINTS FIX (czyści + usuwa dolny highlight)
function preprocessDuelPoints(lines: string[]): string[] {
  const result: string[] = [];

  for (let line of lines) {
    const lower = line.toLowerCase();

    // 🔥 wywal UI śmieci
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

    // 🔥 usuń dziwne znaki OCR z początku
    line = line.replace(/^[^\w\d]+/, "");

    // 🔥 usuń śmieci z końca (np. "I", "|", itd.)
    line = line.replace(/[^\dMK]+$/i, "");

    // 🔥 linia musi zawierać liczbę
    if (!/[\d]+/.test(line)) continue;

    // 🔥 minimalna długość
    if (line.length < 6) continue;

    result.push(line.trim());
  }

  // 🔥 usuwamy dolne linie (highlight user)
  const CUT_FROM_BOTTOM = 4;

  return result.slice(0, Math.max(0, result.length - CUT_FROM_BOTTOM));
}