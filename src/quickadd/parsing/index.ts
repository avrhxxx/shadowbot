// =====================================
// 📁 src/quickadd/parsing/index.ts
// =====================================

import { QuickAddType } from "../core/QuickAddTypes";
import { parseDonations } from "./donations/DonationsParser";
import { parseDonationsFromLayout } from "./donations/DonationsParser";
import { buildLayout, LayoutRow } from "./layout/LayoutParser";
import { OCRToken } from "../ocr/OCRRunner";
import { createLogger } from "../debug/DebugLogger";

const log = createLogger("PARSER");

type ParseInput = {
  lines?: string[];
  tokens?: OCRToken[];
  layout?: LayoutRow[]; // ✅ FIX
};

export function parseByType(
  type: QuickAddType,
  input: ParseInput,
  traceId: string
) {
  switch (type) {
    case "DONATIONS_POINTS": {
      // 🔥 jeśli layout już istnieje → użyj
      if (input.layout && input.layout.length > 0) {
        log.trace("parse_layout_direct", traceId, {
          rows: input.layout.length,
        });

        return parseDonationsFromLayout(input.layout, traceId);
      }

      // 🔥 fallback: tokens → layout
      if (input.tokens && input.tokens.length > 0) {
        log.trace("parse_layout_flow_start", traceId, {
          tokens: input.tokens.length,
        });

        const layout = buildLayout(input.tokens, traceId);

        return parseDonationsFromLayout(layout, traceId);
      }

      // 🔹 fallback: lines
      if (input.lines && input.lines.length > 0) {
        log.trace("parse_lines_fallback", traceId, {
          lines: input.lines.length,
        });

        return parseDonations(input.lines, traceId);
      }

      return [];
    }

    case "DUEL_POINTS":
    case "RR_SIGNUPS":
    case "RR_RESULTS":
      return [];

    default:
      return [];
  }
}