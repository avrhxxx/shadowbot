/**
 * DonationsParser.ts
 *
 * Parser linii OCR / manual input dla eventu Donations
 */

import { QuickAddEntry } from "../types/QuickAddEntry";

export class DonationsParser {
  /**
   * Parsuje pojedynczą linię tekstu w formacie:
   * Nickname DonationsValue
   * Przykład:
   * RavenBritt 68.38M
   */
  static parseLine(line: string, lineId: number): QuickAddEntry | null {
    const trimmed = line.trim();
    if (!trimmed) return null;

    const tokens = trimmed.split(/\s+/);
    if (tokens.length < 2) {
      return { lineId, rawText: line, nickname: trimmed, value: "", status: "UNREADABLE", confidence: 0 };
    }

    // Ostatni token = wartość donacji
    const valueToken = tokens[tokens.length - 1];
    const nickname = tokens.slice(0, tokens.length - 1).join(" ");

    return {
      lineId,
      rawText: line,
      nickname,
      value: valueToken,
      status: "OK",
      confidence: 100
    };
  }

  /**
   * Parsuje wiele linii na QuickAddEntry[]
   */
  static parseLines(lines: string[]): QuickAddEntry[] {
    return lines.map((line, idx) => this.parseLine(line, idx + 1)).filter((e): e is QuickAddEntry => e !== null);
  }
}