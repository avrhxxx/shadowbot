// =====================================
// 📁 src/quickadd/parsing/layout/LayoutParser.ts
// =====================================

import { OCRToken } from "../../ocr/OCRRunner";
import { createLogger } from "../../debug/DebugLogger";

const log = createLogger("LAYOUT");

// =====================================
// 🧱 TYPES
// =====================================

export type LayoutRow = {
  left: OCRToken[];
  right: OCRToken[];
  raw: OCRToken[];
};

// =====================================
// 🔹 MAIN BUILDER (NO PARSING)
// =====================================

export function buildLayout(
  tokens: OCRToken[],
  traceId: string
): LayoutRow[] {
  log.trace("layout_start", traceId, {
    tokens: tokens.length,
  });

  if (!tokens.length) return [];

  const filtered = filterTokens(tokens, traceId);
  const rows = groupIntoRows(filtered, traceId);
  const structured = buildRowStructure(rows, traceId);

  log.trace("layout_done", traceId, {
    rows: structured.length,
  });

  return structured;
}

// =====================================
// 🔹 STAGE 1 — FILTER TOKENS (ONLY TECHNICAL)
// =====================================

function filterTokens(tokens: OCRToken[], traceId: string): OCRToken[] {
  const filtered = tokens.filter(
    (t) =>
      t.text &&
      t.text.trim().length >= 1 && // 🔥 mniej agresywne
      t.confidence > 20 // 🔥 NIE kasujemy danych!
  );

  log.trace("layout_filter_done", traceId, {
    before: tokens.length,
    after: filtered.length,
  });

  return filtered;
}

// =====================================
// 🔹 STAGE 2 — GROUP INTO ROWS
// =====================================

function groupIntoRows(tokens: OCRToken[], traceId: string): OCRToken[][] {
  const sorted = [...tokens].sort((a, b) => a.y - b.y);

  const rows: OCRToken[][] = [];
  const threshold = 14; // 🔥 lekko zwiększone

  for (const token of sorted) {
    let placed = false;

    for (const row of rows) {
      const avgY = averageY(row);

      if (Math.abs(token.y - avgY) < threshold) {
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

function averageY(row: OCRToken[]): number {
  const sum = row.reduce((acc, t) => acc + t.y, 0);
  return sum / row.length;
}

// =====================================
// 🔹 STAGE 3 — BUILD STRUCTURE (COLUMNS)
// =====================================

function buildRowStructure(
  rows: OCRToken[][],
  traceId: string
): LayoutRow[] {
  const result: LayoutRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    if (row.length < 2) continue;

    const sorted = [...row].sort((a, b) => a.x - b.x);

    const avgX =
      sorted.reduce((acc, t) => acc + t.x, 0) / sorted.length;

    const left = sorted.filter((t) => t.x < avgX);
    const right = sorted.filter((t) => t.x >= avgX);

    result.push({
      left,
      right,
      raw: sorted,
    });

    log.trace("layout_row_structure", traceId, {
      rowIndex: i,
      left: left.map((t) => t.text),
      right: right.map((t) => t.text),
    });
  }

  log.trace("layout_structure_done", traceId, {
    rows: result.length,
  });

  return result;
}