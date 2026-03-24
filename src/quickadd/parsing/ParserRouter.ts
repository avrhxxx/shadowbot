// =====================================
// 📁 src/quickadd/parsing/ParserRouter.ts
// =====================================

/**
 * 🧠 PARSER ROUTER
 *
 * Rola:
 * • wybiera odpowiedni parser na podstawie typu QuickAdd
 * • zarządza fallback flow:
 *    layout → tokens → lines
 *
 * Ważne:
 * • brak logiki domenowej (tylko routing)
 * • parsery są w subfolderach (np. donations/)
 */

import { QuickAddType } from "../core/QuickAddTypes";
import { parseDonations } from "./donations/DonationsParser";
import { parseDonationsFromLayout } from "./donations/DonationsParser";
import { buildLayout, LayoutRow } from "../ocr/layout/LayoutBuilder";
import { OCRToken } from "../ocr/OCREngine";
import { createLogger } from "../debug/DebugLogger";

const log = createLogger("PARSER");

// =====================================
// 🧱 TYPES
// =====================================

type ParseInput = {
  lines?: string[];
  tokens?: OCRToken[];
  layout?: LayoutRow[];
};

// =====================================
// 🎯 MAIN ROUTER
// =====================================

export function parseByType(
  type: QuickAddType,
  input: ParseInput,
  traceId: string
) {
  switch (type) {
    case "DONATIONS_POINTS": {
      // =====================================
      // 🔥 1. DIRECT LAYOUT (BEST QUALITY)
      // =====================================
      if (input.layout && input.layout.length > 0) {
        log.trace("parse_layout_direct", traceId, {
          rows: input.layout.length,
        });

        return parseDonationsFromLayout(input.layout, traceId);
      }

      // =====================================
      // 🔥 2. TOKENS → LAYOUT
      // =====================================
      if (input.tokens && input.tokens.length > 0) {
        log.trace("parse_layout_from_tokens", traceId, {
          tokens: input.tokens.length,
        });

        const layout = buildLayout(input.tokens, traceId);

        return parseDonationsFromLayout(layout, traceId);
      }

      // =====================================
      // 🔹 3. FALLBACK → LINES
      // =====================================
      if (input.lines && input.lines.length > 0) {
        log.trace("parse_lines_fallback", traceId, {
          lines: input.lines.length,
        });

        return parseDonations(input.lines, traceId);
      }

      log.warn("parse_no_input", { type });
      return [];
    }

    // =====================================
    // 🚧 FUTURE TYPES
    // =====================================
    case "DUEL_POINTS":
    case "RR_SIGNUPS":
    case "RR_RESULTS":
      log.warn("parser_not_implemented", { type });
      return [];

    default:
      log.warn("unknown_parser_type", { type });
      return [];
  }
}