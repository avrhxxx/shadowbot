// =====================================
// 📁 src/quickadd/parsing/ParserRouter.ts
// =====================================

/**
 * 🧠 PARSER ROUTER (REGISTRY BASED)
 *
 * Rola:
 * • wybiera parser na podstawie typu
 * • deleguje parsing (NO fallback logic)
 *
 * ❗ RULES:
 * - ONLY routing
 * - NO layout building
 * - NO fallback logic
 */

import { QuickAddType } from "../core/QuickAddTypes";
import { LayoutRow } from "../ocr/layout/LayoutBuilder";
import { createLogger } from "../debug/DebugLogger";

import {
  parseDonationsFromLayout,
} from "./donations/DonationsParser";

const log = createLogger("PARSER");

// =====================================
// 🧱 TYPES
// =====================================

type ParserFn = (
  layout: LayoutRow[],
  traceId: string
) => any[];

const registry = new Map<QuickAddType, ParserFn>();

// =====================================
// 🧩 REGISTRATION (MANUAL)
// =====================================

function registerParser(
  type: QuickAddType,
  parser: ParserFn
) {
  registry.set(type, parser);
}

// 🔥 REGISTER PARSERS
registerParser("DONATIONS_POINTS", parseDonationsFromLayout);

// =====================================
// 🎯 MAIN ROUTER
// =====================================

export function parseByType(
  type: QuickAddType,
  input: { layout?: LayoutRow[] },
  traceId: string
) {
  const layout = input.layout ?? [];

  log.trace("parser_input", traceId, {
    type,
    layoutRows: layout.length,
  });

  const parser = registry.get(type);

  if (!parser) {
    log.warn("parser_not_found", traceId, {
      type,
    });
    return [];
  }

  if (!layout.length) {
    log.warn("parser_empty_layout", traceId, {
      type,
    });
    return [];
  }

  try {
    const result = parser(layout, traceId);

    log.trace("parser_output", traceId, {
      type,
      entries: result.length,
    });

    return result;

  } catch (err) {
    log.warn("parser_failed", traceId, {
      type,
      error: err,
    });

    return [];
  }
}