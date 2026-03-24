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
// 🔹 CONFIG (TUNING POINT)
// =====================================

const ROW_Y_THRESHOLD = 12;          // grupowanie wierszy
const MIN_CONFIDENCE = 40;           // filtr OCR śmieci

// kolumny (dopasowane do UI — można później zrobić dynamiczne)
const NICKNAME_MIN_X = 120;
const NICKNAME_MAX_X = 700;

const VALUE_MIN_X = 700;

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
  // 🔹 STEP 0: FILTER BAD TOKENS
  // =====================================

  const filtered = tokens.filter(
    (t) =>
      t.text &&
      t.text.trim().length > 0 &&
      t.confidence >= MIN_CONFIDENCE
  );

  // =====================================
  // 🔹 STEP 1: GROUP INTO ROWS
  // =====================================

  const rows = groupIntoRows(filtered);

  log.trace("layout_rows_grouped", traceId, {
    rows: rows.length,
  });

  // =====================================
  // 🔹 STEP 2: BUILD ENTRIES
  // =====================================

  const entries: LayoutEntry[] = [];

  for (const row of rows) {
    if (row.length < 2) continue;

    const nicknameTokens = row.filter(
      (t) => t.x >= NICKNAME_MIN_X && t.x <= NICKNAME_MAX_X
    );

    const valueTokens = row.filter(
      (t) => t.x >= VALUE_MIN_X
    );

    if (!nicknameTokens.length || !valueTokens.length) continue;

    const nicknameRaw = joinTokens(nicknameTokens);
    const valueRaw = joinTokens(valueTokens);

    if (!isValidValue(valueRaw)) continue;

    entries.push({
      nicknameRaw,
      valueRaw,
    });
  }

  log.trace("layout_entries_built", traceId, {
    count: entries.length,
  });

  log.trace("layout_sample", traceId, {
    sample: entries.slice(0, 5),
  });

  return entries;
}

// =====================================
// 🔹 GROUPING LOGIC (IMPROVED)
// =====================================

function groupIntoRows(tokens: OCRToken[]): OCRToken[][] {
  const sorted = [...tokens].sort((a, b) => a.y - b.y);

  const rows: OCRToken[][] = [];

  for (const token of sorted) {
    let placed = false;

    for (const row of rows) {
      const avgY = averageY(row);

      if (Math.abs(token.y - avgY) <= ROW_Y_THRESHOLD) {
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
// 🔹 TOKEN JOINING
// =====================================

function joinTokens(tokens: OCRToken[]): string {
  return tokens
    .sort((a, b) => a.x - b.x)
    .map((t) => t.text)
    .join("")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// =====================================
// 🔹 VALUE VALIDATION
// =====================================

function isValidValue(value: string): boolean {
  // musi zawierać cyfry
  if (!/\d{2,}/.test(value)) return false;

  // nie może być śmieciem typu "|", "-"
  if (value.length < 3) return false;

  return true;
}