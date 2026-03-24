// =====================================
// 📁 src/quickadd/parsing/layout/LayoutParser.ts
// =====================================

import { OCRToken } from "../../ocr/OCRRunner";
import { createLogger } from "../../debug/DebugLogger";

const log = createLogger("LAYOUT");

// =====================================
// 🧱 TYPES
// =====================================

export type LayoutEntry = {
  nicknameRaw: string;
  valueRaw: string;
};

// =====================================
// 🔹 MAIN PARSER
// =====================================

export function extractLayoutEntries(
  tokens: OCRToken[],
  traceId: string
): LayoutEntry[] {
  log.trace("layout_start", traceId, {
    tokens: tokens.length,
  });

  if (!tokens.length) return [];

  // =====================================
  // 🔹 STEP 1: GROUP INTO ROWS (by Y)
  // =====================================

  const rows = groupIntoRows(tokens);

  log.trace("layout_rows_grouped", traceId, {
    rows: rows.length,
  });

  // =====================================
  // 🔹 STEP 2: BUILD ENTRIES
  // =====================================

  const entries: LayoutEntry[] = [];

  for (const row of rows) {
    if (row.length < 2) continue;

    // sort left → right
    const sorted = row.sort((a, b) => a.x - b.x);

    const left = sorted[0];
    const right = sorted[sorted.length - 1];

    const nicknameRaw = left.text;
    const valueRaw = right.text;

    if (!nicknameRaw || !valueRaw) continue;

    entries.push({
      nicknameRaw,
      valueRaw,
    });
  }

  log.trace("layout_entries_built", traceId, {
    count: entries.length,
  });

  // 🔥 DEBUG SAMPLE
  log.trace("layout_sample", traceId, {
    sample: entries.slice(0, 5),
  });

  return entries;
}

// =====================================
// 🔹 GROUPING LOGIC
// =====================================

function groupIntoRows(tokens: OCRToken[]): OCRToken[][] {
  const sorted = [...tokens].sort((a, b) => a.y - b.y);

  const rows: OCRToken[][] = [];

  const threshold = 10; // 🔥 do tuningu

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

  return rows;
}

function averageY(row: OCRToken[]): number {
  const sum = row.reduce((acc, t) => acc + t.y, 0);
  return sum / row.length;
}