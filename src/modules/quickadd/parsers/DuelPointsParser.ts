/**
 * DuelPointsParser.ts
 *
 * Parser linii OCR / manual input dla eventu Duel Points
 */

import { QuickAddEntry } from "../types/QuickAddEntry";

export class DuelPointsParser {
  /**
   * Parsuje pojedynczą linię tekstu w formacie:
   * [opcjonalny ranking / tag] Nickname
   * Points Value
   * 
   * Przykład:
   * #227 [XXX] RavenBritt
   * 68.38M
   */
  static parseLine(line: string, lineId: number): QuickAddEntry | null {
    const trimmed = line.trim();
    if (!trimmed) return null;

    const tokens = trimmed.split(/\s+/);
    if (tokens.length < 2) {
      return { lineId, rawText: line, nickname: trimmed, value: "", status: "UNREADABLE", confidence: 0 };
    }

    // Ostatni token to wartość punktowa
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