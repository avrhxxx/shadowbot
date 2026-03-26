// =====================================
// 📁 src/quickadd/parsing/duel/DuelParser.ts
// =====================================

/**
 * 🧠 ROLE:
 * Parser for DUEL_POINTS screenshots.
 *
 * Responsible for:
 * - extracting nickname + points from layout rows
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

export function parseDuel(
  input: { layout: LayoutRow[] },
  traceId: string
): ParsedEntry[] {
  const { layout } = input;

  // 🔥 PLACEHOLDER
  // TODO: implement duel parsing logic

  return [];
}