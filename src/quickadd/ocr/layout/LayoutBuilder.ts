// =====================================
// 📁 src/quickadd/ocr/layout/LayoutBuilder.ts
// =====================================

/**
 * 🧠 ROLE:
 * Converts OCR tokens into structured layout (rows + cells).
 *
 * This is NOT a parser.
 *
 * It builds a geometric representation:
 *   tokens → rows → cells (multi-column support)
 *
 * Used by:
 * - ParserRouter (before parsing)
 *
 * ❗ RULES:
 * - NO cleaning
 * - NO domain logic
 * - PURE structure
 */

import { OCRToken } from "../OCRTypes";
import { createLogger } from "../../debug/DebugLogger";

const log = createLogger("LAYOUT");

// =====================================
// 🧱 TYPES
// =====================================

export type NormalizedToken = OCRToken & {
  nx: number;
  ny: number;
};

export type LayoutCell = {
  tokens: NormalizedToken[];
  text: string;
  xStart: number;
  xEnd: number;
};

export type LayoutRow = {
  cells: LayoutCell[];
  raw: NormalizedToken[];
};

// =====================================
// 🔹 MAIN BUILDER
// =====================================

export function buildLayout(
  tokens: OCRToken[],
  traceId: string
): LayoutRow[] {
  log.trace("layout_start", traceId, {
    tokens: tokens.length,
  });

  if (!tokens.length) return [];

  const normalized = normalize(tokens, traceId);
  const filtered = filter(normalized, traceId);
  const rows = groupRows(filtered, traceId);
  const structured