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
 * - STRICT typing (no any)
 * - registry must be complete (snapshot enforced)
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

export type ParsedEntry = {
  nickname: string;
  value: number;
};

type ParserFn = (
  layout: LayoutRow[],
  traceId: string
) => ParsedEntry[];

const registry = new Map<QuickAddType, ParserFn>();

const EXPECTED_PARSERS = 4;

// =====================================
// 🧩 REGISTRATION
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
// 🔍 REGISTRY VALIDATION
// =====================================

(function validateRegistry() {
  if (registry.size !== EXPECTED_PARSERS) {
    log.warn("parser_registry_incomplete", {
      registered: registry.size,
      expected: EXPECTED_PARSERS,
    });
  } else {
    log.trace("parser_registry_ready", {
      count: registry.size,
    });
  }
})();

// =====================================
// 🎯 MAIN ROUTER
// =====================================

export function parseByType(
  type: QuickAddType,
  input: { layout: LayoutRow[] },
  traceId: string
): ParsedEntry[] {
  if (!traceId) {
    throw new Error("traceId is required in parseByType");
  }

  const layout = input.layout;

  const parser = registry.get(type);

  log.trace("parser_start", traceId, {
    type,
    parser: parser?.name ?? "UNKNOWN",
    layoutRows: layout.length,
  });

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

    log.trace("parser_done", traceId, {
      type,
      parser: parser.name,
      entries: result.length,
    });

    return result;

  } catch (err) {
    log.warn("parser_failed", traceId, {
      type,
      parser: parser.name,
      error: err,
    });

    return [];
  }
}