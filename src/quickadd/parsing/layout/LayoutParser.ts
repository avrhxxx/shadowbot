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
// 🔹 MAIN PARSER (PIPELINE VERSION)
// =====================================

export function extractLayoutEntries(
  tokens: OCRToken[],
  traceId: string
): LayoutEntry[] {
  log.trace("layout_start", traceId, {
    tokens: tokens.length,
  });

  if (!tokens.length) return [];

  const rows = groupIntoRows(tokens);
  log.trace("layout_rows_grouped", traceId, { rows: rows.length });

  const mergedRows = rows.map(mergeRowTokens);
  log.trace("layout_rows_merged", traceId, {
    rows: mergedRows.length,
  });

  const entries = mergedRows
    .map(splitRowToEntry)
    .filter((e): e is LayoutEntry => e !== null);

  log.trace("layout_entries_built", traceId, {
    count: entries.length,
  });

  log.trace("layout_sample", traceId, {
    sample: entries.slice(0, 5),
  });

  return entries;
}

// =====================================
// 🔹 STEP 1 — GROUP ROWS
// =====================================

function groupIntoRows(tokens: OCRToken[]): OCRToken[][] {
  const sorted = [...tokens].sort((a, b) => a.y - b.y);
  const rows: OCRToken[][] = [];
  const threshold = 12;

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
  return row.reduce((acc, t) => acc + t.y, 0) / row.length;
}

// =====================================
// 🔹 STEP 2 — MERGE TOKENS IN ROW
// =====================================

function mergeRowTokens(row: OCRToken[]): string {
  const sorted = [...row].sort((a, b) => a.x - b.x);

  const parts = sorted
    .filter((t) => t.confidence > 40) // 🔥 filtr śmieci
    .map((t) => t.text.trim())
    .filter((t) => t.length > 0);

  return parts.join(" ");
}

// =====================================
// 🔹 STEP 3 — SPLIT INTO ENTRY
// =====================================

function splitRowToEntry(rowText: string): LayoutEntry | null {
  if (!rowText) return null;

  // 🔥 szukamy liczby na końcu
  const match = rowText.match(/(.+?)\s+([\d\s,]+)$/);

  if (!match) return null;

  const nicknameRaw = match[1].trim();
  const valueRaw = match[2].trim();

  if (!nicknameRaw || !valueRaw) return null;

  // 🔥 szybka walidacja
  if (!/[a-zA-Z]/.test(nicknameRaw)) return null;
  if (!/\d/.test(valueRaw)) return null;

  return {
    nicknameRaw,
    valueRaw,
  };
}