// =====================================
// 📁 src/quickadd/parsing/ParserRouter.ts
// =====================================

import { QuickAddType, ParsedEntry } from "../core/QuickAddTypes";
import { LayoutRow } from "../ocr/layout/LayoutBuilder";
import { logger } from "../../core/logger/log";

import {
  parseDonationsFromLayout,
} from "./donations/DonationsParser";

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
// 🔥 REGISTRY (STRICT)
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

  const layout = input.layout;

  logger.emit({
    scope: "quickadd.parser",
    event: "parser_input",
    traceId,
    context: {
      type,
      layoutRows: layout.length,
    },
  });

  const parser = registry[type];

  // 🔴 HARD GUARANTEE (system integrity)
  if (!parser) {
    logger.emit({
      scope: "quickadd.parser",
      event: "parser_missing",
      traceId,
      level: "error",
      context: { type },
    });

    throw new Error(`Parser not registered for type: ${type}`);
  }

  if (!layout.length) {
    logger.emit({
      scope: "quickadd.parser",
      event: "parser_empty_layout",
      traceId,
      level: "warn",
      context: { type },
    });

    return [];
  }

  try {
    const result = parser(input, traceId);

    logger.emit({
      scope: "quickadd.parser",
      event: "parser_output",
      traceId,
      context: {
        type,
      },
      stats: {
        entries: result.length,
      },
    });

    return result;

  } catch (err) {
    logger.emit({
      scope: "quickadd.parser",
      event: "parser_failed",
      traceId,
      level: "error",
      context: { type },
      error: err,
    });

    return [];
  }
}