/**
 * ReservoirRaidParser.ts
 *
 * Parser linii OCR / manual input dla eventu Reservoir Raid
 */

import { QuickAddEntry } from "../types/QuickAddEntry";

export class ReservoirRaidParser {
  /**
   * Parsuje pojedynczą linię tekstu w formacie:
   * Nickname
   * Raid Score
   */
  static parseLine(line: string, lineId: number): QuickAddEntry | null {
    const trimmed = line.trim();
    if (!trimmed) return null;

    const tokens = trimmed.split(/\s+/);
    if (tokens.length < 2) return { lineId, rawText: line, nickname: trimmed, value: "", status: "UNREADABLE", confidence: 0 };

    const scoreToken = tokens[tokens.length - 1];
    const nickname = tokens.slice(0, tokens.length - 1).join(" ");

    return {
      lineId,
      rawText: line,
      nickname,
      value: scoreToken,
      status: "OK",
      confidence: 100 // na początek pełne zaufanie dla manual input; OCR później obniży jeśli trzeba
    };
  }

  /**
   * Parsuje wiele linii na QuickAddEntry[]
   */
  static parseLines(lines: string[]): QuickAddEntry[] {
    return lines.map((line, idx) => this.parseLine(line, idx + 1)).filter((e): e is QuickAddEntry => e !== null);
  }
}