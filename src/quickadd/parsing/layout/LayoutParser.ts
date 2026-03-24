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
// 🔹 MAIN PARSER (STAGE-BASED)
// =====================================

export function extractLayoutEntries(
  tokens: OCRToken[],
  traceId: string
): LayoutEntry[] {
  log.trace("layout_start", traceId, {
    tokens: tokens.length,
  });

  if (!tokens.length) return [];

  // 🔹 1. FILTER TOKENS
  const filtered = filterTokens(tokens, traceId);

  // 🔹 2. GROUP INTO ROWS
  const rows = groupIntoRows(filtered, traceId);

  // 🔹 3. BUILD ROW STRUCTURE
  const structured = buildRowStructure(rows, traceId);

  // 🔹 4. EXTRACT ENTRIES
  const entries = extractEntries(structured, traceId);

  log.trace("layout_done", traceId, {
    entries: entries.length,
  });

  return entries;
}

// =====================================
// 🔹 STAGE 1 — FILTER TOKENS
// =====================================

function filterTokens(tokens: OCRToken[], traceId: string): OCRToken[] {
  const filtered = tokens.filter(
    (t) =>
      t.text &&
      t.text.trim().length >= 2 &&
      t.confidence > 40
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

  log.trace("layout_rows_grouped", traceId, {
    rows: rows.length,
  });

  log.trace("layout_rows_sample", traceId, {
    sample: rows.slice(0, 5).map((r) =>
      r.map((t) => ({
        text: t.text,
        x: t.x,
        y: t.y,
        conf: t.confidence,
      }))
    ),
  });

  return rows;
}

function averageY(row: OCRToken[]): number {
  const sum = row.reduce((acc, t) => acc + t.y, 0);
  return sum / row.length;
}

// =====================================
// 🔹 STAGE 3 — ROW STRUCTURE
// =====================================

type StructuredRow = {
  left: OCRToken[];
  right: OCRToken[];
  raw: OCRToken[];
};

function buildRowStructure(rows: OCRToken[][], traceId: string): StructuredRow[] {
  const result: StructuredRow[] = [];

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

// =====================================
// 🔹 STAGE 4 — EXTRACT ENTRIES
// =====================================

function extractEntries(
  rows: StructuredRow[],
  traceId: string
): LayoutEntry[] {
  const entries: LayoutEntry[] = [];

  for (const row of rows) {
    let nickname = joinTokens(row.left);
    let value = joinTokens(row.right);

    if (!nickname || !value) continue;

    // 🔥 SWAP if OCR mixed columns
    if (!looksLikeNumber(value) && looksLikeNumber(nickname)) {
      const tmp = nickname;
      nickname = value;
      value = tmp;
    }

    // 🔥 FILTER: remove sentences (UI text)
    if (looksLikeSentence(nickname)) continue;

    // 🔥 FILTER: remove known garbage
    if (/donations|required|least/i.test(nickname)) continue;

    // 🔥 FILTER: too short nickname
    if (nickname.length < 3) continue;

    // 🔥 VALID NUMBER CHECK
    if (!looksLikeNumber(value)) continue;

    entries.push({
      nicknameRaw: nickname,
      valueRaw: value,
    });

    log.trace("layout_entry_built", traceId, {
      nicknameRaw: nickname,
      valueRaw: value,
      fullRow: row.raw.map((t) => t.text),
    });
  }

  log.trace("layout_entries_built", traceId, {
    count: entries.length,
  });

  return entries;
}

// =====================================
// 🔧 HELPERS
// =====================================

function joinTokens(tokens: OCRToken[]): string {
  return tokens
    .sort((a, b) => a.x - b.x)
    .map((t) => t.text)
    .join(" ")
    .trim();
}

function looksLikeNumber(text: string): boolean {
  const clean = text.replace(/[^\d]/g, "");
  return /^\d{3,}$/.test(clean);
}

function looksLikeSentence(text: string): boolean {
  return text.split(" ").length >= 4;
}