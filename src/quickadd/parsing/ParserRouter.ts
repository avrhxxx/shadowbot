// =====================================
// 📁 src/quickadd/parsing/ParserRouter.ts
// =====================================

/**
 * 🧠 PARSER ROUTER (REGISTRY BASED)
 *
 * ROLE:
 * - selects parser based on QuickAddType
 * - delegates parsing
 *
 * 🔥 SYSTEM POSITION:
 * OCR → Layout → Parser → Validator
 *
 * ❗ RULES:
 * - ONLY routing
 * - NO layout building
 * - NO fallback logic (beyond safe empty return)
 * - STRICT typing (no any)
 * - traceId REQUIRED
 * - LOGGING via log.emit (GLOBAL API)
 *
 * ✅ FINAL:
 * - deterministic
 * - compile-time safe registry
 */

import { QuickAddType, ParsedEntry } from "../core/QuickAddTypes";
import { LayoutRow } from "../ocr/layout/LayoutBuilder";
import { log } from "@/quickadd/debug/logger";

import { parseDonationsFromLayout } from "./donations/DonationsParser";
import { parseDuel } from "./duel/DuelParser";
import { parseReservoirSignups } from "./reservoir/ReservoirSignupsParser";
import { parseReservoirResults } from "./reservoir/ReservoirResultsParser";

// =====================================
// 🧱 TYPES
// =====================================

type ParserFn = (
  input: { layout: LayoutRow[] },
  traceId: string
) => ParsedEntry[];

// =====================================
// 🧠 REGISTRY (COMPILE-TIME SAFE)
// =====================================

const registry: Record<QuickAddType, ParserFn> = {
  DONATIONS_POINTS: parseDonationsFromLayout,
  DUEL_POINTS: parseDuel,
  RR_SIGNUPS: parseReservoirSignups,
  RR_RESULTS: parseReservoirResults,
};

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

  log.emit({
    scope: "ParserRouter",
    event: "parser_input",
    traceId,
    data: {
      type,
      layoutRows: input.layout.length,
    },
  });

  const parser = registry[type];

  if (!parser) {
    log.emit({
      scope: "ParserRouter",
      event: "parser_not_found",
      traceId,
      data: { type },
      level: "warn",
    });

    return [];
  }

  if (!input.layout.length) {
    log.emit({
      scope: "ParserRouter",
      event: "parser_empty_layout",
      traceId,
      data: { type },
      level: "warn",
    });

    return [];
  }

  try {
    const result = parser(input, traceId);

    log.emit({
      scope: "ParserRouter",
      event: "parser_output",
      traceId,
      data: {
        type,
        entries: result.length,
      },
    });

    return result;

  } catch (error) {
    log.emit({
      scope: "ParserRouter",
      event: "parser_failed",
      traceId,
      data: {
        type,
        error,
      },
      level: "error",
    });

    return [];
  }
}