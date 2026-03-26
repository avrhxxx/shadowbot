// =====================================
// 📁 src/quickadd/parsing/reservoir/ReservoirResultsParser.ts
// =====================================

/**
 * 🧠 ROLE:
 * Parser for RESERVOIR_RESULTS screenshots.
 *
 * Responsible for:
 * - extracting results data from layout rows
 *
 * ❗ RULES:
 * - NO validation
 * - NO business logic
 * - ONLY parsing
 * - deterministic output
 */

import { ParsedEntry } from "../../core/QuickAddTypes";
import { LayoutRow } from "../../ocr/layout/LayoutBuilder";

// =====================================
// 🚀 PARSER
// =====================================

export function parseReservoirResults(
  input: { layout: LayoutRow[] },
  traceId: string
): ParsedEntry[] {
  const { layout } = input;

  // 🔥 PLACEHOLDER
  // TODO: implement reservoir results parsing logic

  return [];
}