// =====================================
// 📁 src/quickadd/parsing/ParserRouter.ts
// =====================================

import { QuickAddType, ParsedEntry } from "../core/QuickAddTypes";
import { LayoutRow } from "../ocr/layout/LayoutBuilder";
import { log } from "../logger";

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

const registry = new Map<QuickAddType, ParserFn>();

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

  log.emit({
    event: "parser_input",
    traceId,
    data: {
      type,
      layoutRows: layout.length,
    },
  });

  const parser = registry.get(type);

  if (!parser) {
    log.emit({
      event: "parser_not_found",
      traceId,
      level: "warn",
      data: { type },
    });
    return [];
  }

  if (!layout.length) {
    log.emit({
      event: "parser_empty_layout",
      traceId,
      level: "warn",
      data: { type },
    });
    return [];
  }

  try {
    const result = parser(input, traceId);

    log.emit({
      event: "parser_output",
      traceId,
      data: {
        type,
        entries: result.length,
      },
    });

    return result;

  } catch (err) {
    log.emit({
      event: "parser_failed",
      traceId,
      level: "error",
      data: {
        type,
        error: err,
      },
    });

    return [];
  }
}