// =====================================
// 📁 src/quickadd/parsing/reservoir/ReservoirSignupsParser.ts
// =====================================

/**
 * 🧠 ROLE:
 * Parser for RESERVOIR_SIGNUPS screenshots.
 *
 * Responsible for:
 * - extracting signup data from layout rows
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

export function parseReservoirSignups(
  input: { layout: LayoutRow[] },
  traceId: string
): ParsedEntry[] {
  const { layout } = input;

  // 🔥 PLACEHOLDER
  // TODO: implement reservoir signups parsing logic

  return [];
}