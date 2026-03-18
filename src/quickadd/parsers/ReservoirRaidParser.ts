import { unicodeCleaner } from "../utils/unicodeCleaner";
import { parseNumber } from "../utils/numberParser";
import { ParsedEntry } from "../types/ParsedEntry";

export class ReservoirRaidParser {
  static parseLine(rawLine: string): ParsedEntry {
    const cleaned = unicodeCleaner(rawLine);

    const match = cleaned.match(/(.+?)\s+([\d.,]+)$/);

    if (!match) {
      return {
        rawText: rawLine,
        nickname: cleaned,
        value: null
      };
    }

    const nickname = match[1].replace("(No Team)", "").trim();
    const value = parseNumber(match[2]);

    return {
      rawText: rawLine,
      nickname,
      value
    };
  }

  static parseMany(input: string): ParsedEntry[] {
    return input
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => this.parseLine(line));
  }
}