// =====================================
// 📁 src/quickadd/ocr/layout/LayoutBuilder.ts
// =====================================

/**
 * 🧠 ROLE:
 * Pure layout builder (NOT a parser).
 *
 * Responsible for:
 * - transforming OCR tokens into structured layout (rows → cells)
 * - preserving geometry (no business logic)
 *
 * ❗ RULES:
 * - NO cleaning
 * - NO parsing
 * - ONLY structure
 */

import { OCRToken } from "../OCREngine";
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

  const normalized = normalizeTokens(tokens, traceId);
  const filtered = filterTokens(normalized, traceId);
  const rows = groupIntoRows(filtered, traceId);
  const structured = buildRowStructure(rows, traceId);

  log.trace("layout_done", traceId, {
    rows: structured.length,
  });

  return structured;
}

// =====================================
// 🔹 NORMALIZATION
// =====================================

function normalizeTokens(
  tokens: OCRToken[],
  traceId: string
): NormalizedToken[] {
  const maxX = tokens.length
    ? Math.max(...tokens.map((t) => t.x + t.width))
    : 0;

  const maxY = tokens.length
    ? Math.max(...tokens.map((t) => t.y + t.height))
    : 0;

  const normalized = tokens.map((t) => ({
    ...t,
    nx: maxX ? t.x / maxX : 0,
    ny: maxY ? t.y / maxY : 0,
  }));

  log.trace("layout_normalized", traceId, {
    count: normalized.length,
  });

  return normalized;
}

// =====================================
// 🔹 FILTER (ONLY TECHNICAL)
// =====================================

function filterTokens(
  tokens: NormalizedToken[],
  traceId: string
): NormalizedToken[] {
  const filtered = tokens.filter(
    (t) =>
      t.text &&
      t.text.trim().length >= 1 &&
      t.confidence > 20
  );

  log.trace("layout_filter_done", traceId, {
    before: tokens.length,
    after: filtered.length,
  });

  return filtered;
}

// =====================================
// 🔹 GROUP INTO ROWS
// =====================================

function groupIntoRows(
  tokens: NormalizedToken[],
  traceId: string
): NormalizedToken[][] {
  const sorted = [...tokens].sort((a, b) => a.ny - b.ny);

  const rows: NormalizedToken[][] = [];
  const threshold = 0.015;

  for (const token of sorted) {
    let placed = false;

    for (const row of rows) {
      const avgY = averageNY(row);

      if (Math.abs(token.ny - avgY) < threshold) {
        row.push(token);
        placed = true;
        break;
      }
    }

    if (!placed) {
      rows.push([token]);
    }
  }

  log.trace("layout_rows_grouped", traceId, {
    rows: rows.length,
  });

  return rows;
}

function averageNY(row: NormalizedToken[]): number {
  const sum = row.reduce((acc, t) => acc + t.ny, 0);
  return sum / row.length;
}

// =====================================
// 🔹 BUILD ROW STRUCTURE
// =====================================

function buildRowStructure(
  rows: NormalizedToken[][],
  traceId: string
): LayoutRow[] {
  const result: LayoutRow[] = [];

  const GAP_THRESHOLD = 0.05;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    if (row.length < 1) continue;

    const sorted = [...row].sort((a, b) => a.nx - b.nx);

    const cells: LayoutCell[] = [];
    let currentTokens: NormalizedToken[] = [sorted[0]];

    for (let j = 1; j < sorted.length; j++) {
      const prev = sorted[j - 1];
      const curr = sorted[j];

      const gap = curr.nx - prev.nx;

      if (gap > GAP_THRESHOLD) {
        cells.push(buildCell(currentTokens));
        currentTokens = [curr];
      } else {
        currentTokens.push(curr);
      }
    }

    if (currentTokens.length) {
      cells.push(buildCell(currentTokens));
    }

    result.push({
      cells,
      raw: sorted,
    });

    log.trace("layout_row_cells", traceId, {
      rowIndex: i,
      cells: cells.map((c) => c.text),
    });
  }

  log.trace("layout_structure_done", traceId, {
    rows: result.length,
  });

  return result;
}

// =====================================
// 🔧 CELL BUILDER
// =====================================

function buildCell(tokens: NormalizedToken[]): LayoutCell {
  const sorted = [...tokens].sort((a, b) => a.x - b.x);

  const text = sorted.map((t) => t.text).join(" ").trim();

  const xStart = Math.min(...sorted.map((t) => t.nx));
  const xEnd = Math.max(...sorted.map((t) => t.nx));

  return {
    tokens: sorted,
    text,
    xStart,
    xEnd,
  };
}