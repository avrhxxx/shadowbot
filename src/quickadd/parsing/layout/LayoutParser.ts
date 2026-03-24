// =====================================
// 📁 src/quickadd/parsing/layout/LayoutParser.ts
// =====================================

import { OCRToken } from "../../ocr/OCRRunner";
import { createLogger } from "../../debug/DebugLogger";

const log = createLogger("LAYOUT");

// =====================================
// 🧱 TYPES
// =====================================

export type NormalizedToken = OCRToken & {
  nx: number;
  ny: number;
};

export type LayoutRow = {
  left: NormalizedToken[];
  right: NormalizedToken[];
  raw: NormalizedToken[];
};

// =====================================
// 🔹 MAIN BUILDER (PURE LAYOUT)
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

function normalizeTokens(tokens: OCRToken[], traceId: string): NormalizedToken[] {
  const maxX = Math.max(...tokens.map((t) => t.x + t.width));
  const maxY = Math.max(...tokens.map((t) => t.y + t.height));

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
// 🔹 FILTER
// =====================================

function filterTokens(tokens: NormalizedToken[], traceId: string): NormalizedToken[] {
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

function groupIntoRows(tokens: NormalizedToken[], traceId: string): NormalizedToken[][] {
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
// 🔹 BUILD STRUCTURE (GAP SPLIT)
// =====================================

function buildRowStructure(
  rows: NormalizedToken[][],
  traceId: string
): LayoutRow[] {
  const result: LayoutRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    if (row.length < 2) continue;

    const sorted = [...row].sort((a, b) => a.nx - b.nx);

    let maxGap = 0;
    let splitIndex = 1;

    for (let j = 1; j < sorted.length; j++) {
      const gap = sorted[j].nx - sorted[j - 1].nx;

      if (gap > maxGap) {
        maxGap = gap;
        splitIndex = j;
      }
    }

    const left = sorted.slice(0, splitIndex);
    const right = sorted.slice(splitIndex);

    result.push({
      left,
      right,
      raw: sorted,
    });

    log.trace("layout_row_structure", traceId, {
      rowIndex: i,
      gap: maxGap,
      left: left.map((t) => t.text),
      right: right.map((t) => t.text),
    });
  }

  log.trace("layout_structure_done", traceId, {
    rows: result.length,
  });

  return result;
}