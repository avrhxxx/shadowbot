import { QuickAddEntry } from "../types/QuickAddEntry";
import { unicodeCleaner } from "../utils/unicodeCleaner";
import { parseNumber } from "../utils/numberParser";

export type OCRSegment = string[];

export class DonationsParser {
  static parseSegment(segment: OCRSegment): QuickAddEntry {
    const joinedLine = segment.map(l => unicodeCleaner(l)).join(" ");
    const parts = joinedLine.trim().split(/\s+/);
    const valueStr = parts.pop() || "0";
    const nickname = parts.join(" ") || "???";
    const parsedValue = parseNumber(valueStr);

    const status: QuickAddEntry["status"] = parsedValue === null ? "UNREADABLE" : "OK";

    return {
      lineId: 0,
      rawText: joinedLine,
      nickname,
      value: valueStr,
      confidence: parsedValue !== null ? 1 : 0,
      status,
      sourceType: "OCR"
    };
  }
}