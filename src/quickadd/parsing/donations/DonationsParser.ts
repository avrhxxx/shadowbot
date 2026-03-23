// =====================================
// 📁 src/quickadd/parsing/donations/DonationsParser.ts
// =====================================

import { createLogger } from "../../debug/DebugLogger";

const log = createLogger("PARSER");

type ParsedEntry = {
  nickname: string;
  value: number;
};

export function parseDonations(lines: string[], traceId: string): ParsedEntry[] {
  const results: ParsedEntry[] = [];

  log.trace("parse_start", traceId, {
    lines: lines.length,
  });

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const match = line.match(/Donations:\s*([\d\s,]+)/i);

    if (!match) continue;

    const rawValue = match[1];
    const value = parseNumber(rawValue);

    const nicknameRaw = findNickname(lines, i);
    const nickname = cleanNickname(nicknameRaw);

    if (!isValidNickname(nickname) || isNaN(value)) {
      log.trace("skipped_entry", traceId, {
        line,
        nicknameRaw,
        rawValue,
        cleanedNickname: nickname,
      });
      continue;
    }

    results.push({
      nickname,
      value,
    });

    log.trace("parsed_entry", traceId, {
      nickname,
      value,
    });
  }

  log.trace("parse_done", traceId, {
    parsed: results.length,
  });

  return results;
}

// =====================================
// 🔍 FIND NICKNAME AROUND
// =====================================
function findNickname(lines: string[], index: number): string {
  const candidates = [
    lines[index + 1],
    lines[index + 2],
    lines[index - 1],
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    const cleaned = cleanNickname(candidate);

    if (isValidNickname(cleaned)) {
      return candidate;
    }
  }

  return "";
}

// =====================================
// 🧠 NUMBER PARSER
// =====================================
function parseNumber(raw: string): number {
  return parseInt(
    raw.replace(/[^\d]/g, "")
  );
}

// =====================================
// 🧼 CLEAN FUNCTION
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
// ✅ VALIDATION
// =====================================
function isValidNickname(name: string): boolean {
  if (!name) return false;

  if (name.length < 3) return false;

  if (!/[a-zA-Z]/.test(name)) return false;

  if (/^[^a-zA-Z]+$/.test(name)) return false;

  return true;
}