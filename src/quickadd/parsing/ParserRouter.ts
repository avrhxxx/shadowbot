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
 */

import { QuickAddType, ParsedEntry } from "../core/QuickAddTypes";
import { LayoutRow } from "../ocr/layout/LayoutBuilder";
import { createScopedLogger } from "@/quickadd/debug/logger";

import {
  parseDonationsFromLayout,
} from "./donations/DonationsParser";

import { parseDuel } from "./duel/DuelParser";
import { parseReservoirSignups } from "./reservoir/ReservoirSignupsParser";
import { parseReservoirResults } from "./reservoir/ReservoirResultsParser";

const log = createScopedLogger(import.meta.url);

// =====================================
// 🧱 TYPES
// =====================================

type ParserFn = (
  input: { layout: LayoutRow[] },
  traceId: string
) => ParsedEntry[];

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

// =====================================
// 🔥 REGISTER PARSERS
// =====================================

registerParser("DONATIONS_POINTS", parseDonationsFromLayout);
registerParser("DUEL_POINTS", parseDuel);
registerParser("RR_SIGNUPS", parseReservoirSignups);
registerParser("RR_RESULTS", parseReservoirResults);

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

  log.trace("parser_input", traceId, {
    type,
    layoutRows: layout.length,
  });

  const parser = registry.get(type);

  if (!parser) {
    log.warn("parser_not_found", {
      type,
    });
    return [];
  }

  if (!layout.length) {
    log.warn("parser_empty_layout", {
      type,
    });
    return [];
  }

  try {
    const result = parser(input, traceId);

    log.trace("parser_output", traceId, {
      type,
      entries: result.length,
    });

    return result;

  } catch (err) {
    log.warn("parser_failed", {
      type,
      error: err,
    });

    return [];
  }
}