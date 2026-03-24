// =====================================
// 📁 src/quickadd/parsing/donations/DonationsParser.ts
// =====================================

import { createLogger } from "../../debug/DebugLogger";
import { LayoutRow } from "../layout/LayoutParser";

const log = createLogger("PARSER");

type ParsedEntry = {
  nickname: string;
  value: number;
};

// =====================================
// 🧠 MAIN — LINES (OLD MODE)
// =====================================

export function parseDonations(
  lines: string[],
  traceId: string
): ParsedEntry[] {
  log.trace("parse_start", traceId, { lines: lines.length });

  const candidates = extractCandidates(lines, traceId);
  const paired = pairEntries(candidates, traceId);
  const cleaned = cleanEntries(paired, traceId);
  const final = finalizeEntries(cleaned, traceId);

  log.trace("parse_done", traceId, {
    parsed: final.length,
  });

  return final;
}

// =====================================
// 🔥 MAIN — LAYOUT MODE (CELLS BASED)
// =====================================

export function parseDonationsFromLayout(
  layout: LayoutRow[],
  traceId: string
): ParsedEntry[] {
  log.trace("parse_layout_start", traceId, {
    rows: layout.length,
  });

  const extracted: { nickname: string; valueRaw: string }[] = [];

  for (const row of layout) {
    const cellTexts = row.cells.map((c) => c.text).filter(Boolean);

    if (!cellTexts.length) continue;

    // =====================================
    // 🔍 FIND VALUE CELL (last numeric-like)
    // =====================================
    let valueRaw = "";
    let valueIndex = -1;

    for (let i = cellTexts.length - 1; i >= 0; i--) {
      if (looksLikeNumber(cellTexts[i])) {
        valueRaw = cellTexts[i];
        valueIndex = i;
        break;
      }
    }

    if (!valueRaw) continue;

    // =====================================
    // 🔍 BUILD NICKNAME (everything except value)
    // =====================================
    const nicknameParts = cellTexts.filter((_, idx) => idx !== valueIndex);
    const nickname = nicknameParts.join(" ").trim();

    if (!nickname) continue;

    extracted.push({
      nickname,
      valueRaw,
    });

    log.trace("layout_row_used", traceId, {
      cells: cellTexts,
      nickname,
      valueRaw,
    });
  }

  const cleaned = cleanEntries(extracted, traceId);
  const final = finalizeEntries(cleaned, traceId);

  log.trace("parse_layout_done", traceId, {
    parsed: final.length,
  });

  return final;
}

// =====================================
// 🔍 STAGE 1 — EXTRACT (LINES MODE)
// =====================================

type Candidate = {
  type: "nickname" | "value";
  raw: string;
  index: number;
};

function extractCandidates(lines: string[], traceId: string): Candidate[] {
  const results: Candidate[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const valueMatch = line.match(/Donations:\s*([\d\s,]+)/i);
    if (valueMatch) {
      results.push({
        type: "value",
        raw: valueMatch[1],
        index: i,
      });
      continue;
    }

    if (line && line.length >= 3) {
      results.push({
        type: "nickname",
        raw: line,
        index: i,
      });
    }
  }

  log.trace("extract_done", traceId, { count: results.length });

  return results;
}

// =====================================
// 🔗 STAGE 2 — PAIR (LINES MODE)
// =====================================

function pairEntries(candidates: Candidate[], traceId: string) {
  const results: { nickname: string; valueRaw: string }[] = [];

  for (const c of candidates) {
    if (c.type !== "value") continue;

    const nearby = candidates.filter(
      (x) =>
        x.type === "nickname" &&
        Math.abs(x.index - c.index) <= 2
    );

    if (nearby.length === 0) continue;

    const best = nearby[0];

    results.push({
      nickname: best.raw,
      valueRaw: c.raw,
    });
  }

  log.trace("pair_done", traceId, { count: results.length });

  return results;
}

// =====================================
// 🧼 STAGE 3 — CLEAN
// =====================================

function cleanEntries(
  entries: { nickname: string; valueRaw: string }[],
  traceId: string
) {
  const results: { nickname: string; value: number }[] = [];

  for (const e of entries) {
    const nickname = cleanNickname(e.nickname);
    const value = parseNumber(e.valueRaw);

    results.push({
      nickname,
      value,
    });
  }

  log.trace("clean_done", traceId, { count: results.length });

  return results;
}

// =====================================
// ✅ STAGE 4 — FINAL FILTER
// =====================================

function finalizeEntries(
  entries: { nickname: string; value: number }[],
  traceId: string
): ParsedEntry[] {
  const results: ParsedEntry[] = [];

  for (const e of entries) {
    if (!isValidNickname(e.nickname)) continue;
    if (isNaN(e.value) || e.value <= 0) continue;

    results.push(e);

    log.trace("parsed_entry", traceId, e);
  }

  log.trace("final_done", traceId, { count: results.length });

  return results;
}

// =====================================
// 🔧 HELPERS
// =====================================

function looksLikeNumber(text: string): boolean {
  return /[\d]/.test(text) && /[\d,.\s]/.test(text);
}

function parseNumber(raw: string): number {
  return parseInt(raw.replace(/[^\d]/g, ""));
}

function cleanNickname(name: string): string {
  return name
    .replace(/^\d+\s*/, "")
    .replace(/^[^a-zA-Z0-9]+/, "")
    .replace(/[^a-zA-Z0-9]+$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function isValidNickname(name: string): boolean {
  if (!name) return false;
  if (name.length < 3) return false;
  if (!/[a-zA-Z]/.test(name)) return false;

  if (name === name.toUpperCase()) return false;

  if (/[^a-zA-Z0-9\s]/.test(name) && name.length < 5) return false;

  const blacklist = ["REWARDS", "DONATIONS", "RANKING"];
  for (const word of blacklist) {
    if (name.toUpperCase().includes(word)) return false;
  }

  return true;
}