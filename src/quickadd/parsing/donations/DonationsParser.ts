// =====================================
// 📁 src/quickadd/parsing/donations/DonationsParser.ts
// =====================================

import { LayoutRow } from "../../ocr/layout/LayoutBuilder";
import { ParsedEntry } from "../../core/QuickAddTypes";
import { log } from "../../logger";

// =====================================
// 🔥 MAIN — LAYOUT MODE (PRIMARY)
// =====================================

export function parseDonationsFromLayout(
  input: { layout: LayoutRow[] },
  traceId: string
): ParsedEntry[] {
  if (!traceId) {
    throw new Error("traceId is required in parseDonationsFromLayout");
  }

  const { layout } = input;

  log.emit({
    event: "parse_layout_start",
    traceId,
    data: { rows: layout.length },
  });

  const extracted: { nickname: string; valueRaw: string }[] = [];

  for (const row of layout) {
    const cellTexts = row.cells.map((c) => c.text).filter(Boolean);

    if (!cellTexts.length) continue;

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

    const nicknameParts = cellTexts.filter((_, idx) => idx !== valueIndex);
    const nickname = nicknameParts.join(" ").trim();

    if (!nickname) continue;

    extracted.push({ nickname, valueRaw });

    log.emit({
      event: "layout_row_used",
      traceId,
      data: { cells: cellTexts, nickname, valueRaw },
    });
  }

  const cleaned = cleanEntries(extracted, traceId);
  const final = finalizeEntries(cleaned, traceId);

  log.emit({
    event: "parse_layout_done",
    traceId,
    data: { parsed: final.length },
  });

  return final;
}

// =====================================
// 🔹 FALLBACK — LINES MODE
// =====================================

export function parseDonations(
  lines: string[],
  traceId: string
): ParsedEntry[] {
  if (!traceId) {
    throw new Error("traceId is required in parseDonations");
  }

  log.emit({
    event: "parse_lines_start",
    traceId,
    data: { lines: lines.length },
  });

  const candidates = extractCandidates(lines);
  const paired = pairCandidates(candidates);
  const cleaned = cleanEntries(paired, traceId);
  const final = finalizeEntries(cleaned, traceId);

  return final;
}

// =====================================
// 🔍 STAGE 1 — EXTRACT
// =====================================

type Candidate = {
  type: "nickname" | "value";
  raw: string;
  index: number;
};

function extractCandidates(lines: string[]): Candidate[] {
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

  return results;
}

// =====================================
// 🔗 STAGE 2 — PAIR
// =====================================

function pairCandidates(candidates: Candidate[]) {
  const results: { nickname: string; valueRaw: string }[] = [];

  for (const c of candidates) {
    if (c.type !== "value") continue;

    const nearby = candidates.filter(
      (x) =>
        x.type === "nickname" &&
        Math.abs(x.index - c.index) <= 2
    );

    if (!nearby.length) continue;

    results.push({
      nickname: nearby[0].raw,
      valueRaw: c.raw,
    });
  }

  return results;
}

// =====================================
// 🧼 CLEAN
// =====================================

function cleanEntries(
  entries: { nickname: string; valueRaw: string }[],
  traceId: string
) {
  const results: ParsedEntry[] = [];

  for (const e of entries) {
    const nickname = cleanNickname(e.nickname);
    const value = parseNumber(e.valueRaw);

    results.push({
      nickname,
      value,
    });
  }

  log.emit({
    event: "clean_done",
    traceId,
    data: { count: results.length },
  });

  return results;
}

// =====================================
// ✅ FINAL FILTER
// =====================================

function finalizeEntries(
  entries: ParsedEntry[],
  traceId: string
): ParsedEntry[] {
  const results: ParsedEntry[] = [];

  for (const e of entries) {
    if (!isValidNickname(e.nickname)) continue;
    if (!e.value || e.value <= 0) continue;

    results.push(e);

    log.emit({
      event: "parsed_entry",
      traceId,
      data: e,
    });
  }

  log.emit({
    event: "final_done",
    traceId,
    data: { count: results.length },
  });

  return results;
}

// =====================================
// 🔧 HELPERS
// =====================================

function looksLikeNumber(text: string): boolean {
  return /[\d]/.test(text);
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

  const blacklist = ["REWARDS", "DONATIONS", "RANKING"];
  for (const word of blacklist) {
    if (name.toUpperCase().includes(word)) return false;
  }

  return true;
}