// =====================================
// 📁 src/quickadd/parsing/index.ts
// =====================================

import { QuickAddType } from "../core/QuickAddTypes";
import { parseDonations } from "./donations/DonationsParser";
import { parseDonationsFromLayout } from "./donations/DonationsParser";
import { OCRToken } from "../ocr/OCRRunner";

type ParseInput = {
  lines?: string[];
  tokens?: OCRToken[];
};

export function parseByType(
  type: QuickAddType,
  input: ParseInput,
  traceId: string
) {
  switch (type) {
    case "DONATIONS_POINTS":
      // 🔥 NEW: layout-aware parsing
      if (input.tokens && input.tokens.length > 0) {
        return parseDonationsFromLayout(input.tokens, traceId);
      }

      // 🔹 fallback (old flow)
      if (input.lines) {
        return parseDonations(input.lines, traceId);
      }

      return [];

    // 🔥 PLACEHOLDERS (future ready)
    case "DUEL_POINTS":
    case "RR_SIGNUPS":
    case "RR_RESULTS":
      return [];

    default:
      return [];
  }
}