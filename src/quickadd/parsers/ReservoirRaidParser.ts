import { QuickAddEntry } from "../types/QuickAddEntry";
import { unicodeCleaner } from "../utils/unicodeCleaner";
import { parseNumber } from "../utils/numberParser";

export class ReservoirRaidParser {
  static parseLine(rawLine: string): QuickAddEntry {
    const cleaned = unicodeCleaner(rawLine);
    const parts = cleaned.trim().split(/\s+/);
    const valueStr = parts.pop() || "0";
    const nickname = parts.join(" ") || "???";
    const parsedValue = parseNumber(valueStr);

    const status: QuickAddEntry["status"] = parsedValue === null ? "UNREADABLE" : "OK";

    return {
      lineId: 0, // do nadania w PreviewBuffer
      rawText: rawLine,
      nickname,
      value: valueStr,
      confidence: parsedValue !== null ? 1 : 0,
      status,
      sourceType: "OCR"
    };
  }
}