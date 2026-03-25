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

// ✅ FIX — merged import
import {
  parseDonations,
  parseDonationsFromLayout,
} from "./donations/DonationsParser";

import { buildLayout, LayoutRow } from "../ocr/layout/LayoutBuilder";

// ✅ FIX — import from OCRTypes (not engine)
import { OCRToken } from "../ocr/OCRTypes";

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
  // =====================================
  // 🚀 INPUT
  // =====================================
  log.trace("parser_input", traceId, {
    type,
    hasLayout: !!input.layout?.length,
    layoutRows: input.layout?.length ?? 0,
    hasTokens: !!input.tokens?.length,
    tokens: input.tokens?.length ?? 0,
    hasLines: !!input.lines?.length,
    lines: input.lines?.length ?? 0,
  });

  switch (type) {
    case "DONATIONS_POINTS": {
      log.trace("parser_type_selected", traceId, {
        type: "DONATIONS_POINTS",
      });

      // =====================================
      // 🔥 1. DIRECT LAYOUT (BEST QUALITY)
      // =====================================
      if (input.layout && input.layout.length > 0) {
        log.trace("decision_layout_direct", traceId, {
          rows: input.layout.length,
        });

        const result = parseDonationsFromLayout(input.layout, traceId);

        log.trace("parser_output", traceId, {
          method: "layout_direct",
          entries: result.length,
        });

        return result;
      }

      // =====================================
      // 🔥 2. TOKENS → LAYOUT
      // =====================================
      if (input.tokens && input.tokens.length > 0) {
        log.trace("decision_tokens_to_layout", traceId, {
          tokens: input.tokens.length,
        });

        const layout = buildLayout(input.tokens, traceId);

        log.trace("layout_built", traceId, {
          rows: layout.length,
        });

        const result = parseDonationsFromLayout(layout, traceId);

        log.trace("parser_output", traceId, {
          method: "tokens_to_layout",
          entries: result.length,
        });

        return result;
      }

      // =====================================
      // 🔹 3. FALLBACK → LINES
      // =====================================
      if (input.lines && input.lines.length > 0) {
        log.trace("decision_lines_fallback", traceId, {
          lines: input.lines.length,
        });

        const result = parseDonations(input.lines, traceId);

        log.trace("parser_output", traceId, {
          method: "lines_fallback",
          entries: result.length,
        });

        return result;
      }

      // =====================================
      // ❌ NO INPUT
      // =====================================
      log.warn("parse_no_input", {
        traceId,
        type,
      });

      return [];
    }

    // =====================================
    // 🚧 FUTURE TYPES
    // =====================================
    case "DUEL_POINTS":
    case "RR_SIGNUPS":
    case "RR_RESULTS":
      log.warn("parser_not_implemented", {
        traceId,
        type,
      });

      return [];

    default:
      log.warn("unknown_parser_type", {
        traceId,
        type,
      });

      return [];
  }
}