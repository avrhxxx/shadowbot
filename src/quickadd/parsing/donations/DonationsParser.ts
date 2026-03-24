// =====================================
// 📁 src/quickadd/parsing/donations/DonationsParser.ts
// =====================================

import { createLogger } from "../../debug/DebugLogger";

const log = createLogger("PARSER");

type Candidate = {
  type: "nickname" | "value";
  raw: string;
  index: number;
};

type ParsedEntry = {
  nickname: string;
  value: number;
};

// =====================================
// 🧠 MAIN PARSER (PIPELINE)
// =====================================

export function parseDonations(lines: string[], traceId: string): ParsedEntry[] {
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
// 🔍 STAGE 1 — EXTRACT
// =====================================

function extractCandidates(lines: string[], traceId: string): Candidate[] {
  const results: Candidate[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // VALUE
    const valueMatch = line.match(/Donations:\s*([\d\s,]+)/i);
    if (valueMatch) {
      results.push({
        type: "value",
        raw: valueMatch[1],
        index: i,
      });
      continue;
    }

    // NICKNAME (luźne — wszystko co nie jest oczywistym śmieciem)
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
// 🔗 STAGE 2 — PAIR
// =====================================

function pairEntries(candidates: Candidate[], traceId: string) {
  const results: { nickname: string; valueRaw: string }[] = [];

  for (const c of candidates) {
    if (c.type !== "value") continue;

    // szukamy nickname w pobliżu
    const nearby = candidates.filter(
      (x) =>
        x.type === "nickname" &&
        Math.abs(x.index - c.index) <= 2
    );

    if (nearby.length === 0) continue;

    const best = nearby[0]; // 🔥 na razie pierwszy — później można scoring

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
// 🔢 NUMBER PARSER
// =====================================

function parseNumber(raw: string): number {
  return parseInt(raw.replace(/[^\d]/g, ""));
}

// =====================================
// 🧼 CLEAN NICKNAME (TYLKO TUTAJ!)
// =====================================

function cleanNickname(name: string): string {
  return name
    .replace(/^\d+\s*/, "")
    .replace(/^[^a-zA-Z0-9]+/, "")
    .replace(/[^a-zA-Z0-9]+$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// =====================================
// 🧠 VALIDATION (LIGHT)
// =====================================

function isValidNickname(name: string): boolean {
  if (!name) return false;
  if (name.length < 3) return false;
  if (!/[a-zA-Z]/.test(name)) return false;

  // ❌ ALL CAPS (OCR headers)
  if (name === name.toUpperCase()) return false;

  // ❌ garbage
  if (/[^a-zA-Z0-9\s]/.test(name) && name.length < 5) return false;

  const blacklist = ["REWARDS", "DONATIONS", "RANKING"];
  for (const word of blacklist) {
    if (name.toUpperCase().includes(word)) return false;
  }

  return true;
}