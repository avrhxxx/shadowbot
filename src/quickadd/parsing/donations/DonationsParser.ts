// =====================================
// 📁 src/quickadd/parsing/donations/DonationsParser.ts
// =====================================

import { debugTrace } from "../../debug/DebugLogger";

const SCOPE = "PARSER";

type ParsedEntry = {
  nickname: string;
  value: number;
};

export function parseDonations(lines: string[], traceId: string): ParsedEntry[] {
  const results: ParsedEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // =============================
    // 🔍 SZUKAMY "Donations"
    // =============================
    const match = line.match(/Donations:\s*([\d\s,]+)/i);

    if (!match) continue;

    const rawValue = match[1];

    // =============================
    // 🧠 PARSOWANIE LICZBY
    // =============================
    const value = parseNumber(rawValue);

    // =============================
    // 🔍 SZUKAJ NICKA (NIE TYLKO nextLine)
    // =============================
    const nicknameRaw = findNickname(lines, i);
    const nickname = cleanNickname(nicknameRaw);

    // =============================
    // ❌ VALIDATION
    // =============================
    if (!isValidNickname(nickname) || isNaN(value)) {
      debugTrace(SCOPE, "SKIPPED_ENTRY", traceId, {
        line,
        nicknameRaw,
        rawValue,
        cleanedNickname: nickname,
      });
      continue;
    }

    // =============================
    // ✅ OK
    // =============================
    results.push({
      nickname,
      value,
    });

    debugTrace(SCOPE, "PARSED_ENTRY", traceId, {
      nickname,
      value,
    });
  }

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
    // usuń numer pozycji na początku (np. "4 ", "34 ")
    .replace(/^\d+\s*/, "")
    // usuń śmieci typu "@", "~", ":" na początku
    .replace(/^[^a-zA-Z0-9]+/, "")
    // usuń śmieci z końca
    .replace(/[^a-zA-Z0-9]+$/, "")
    // usuń podwójne spacje
    .replace(/\s{2,}/g, " ")
    .trim();
}

// =====================================
// ✅ VALIDATION
// =====================================
function isValidNickname(name: string): boolean {
  if (!name) return false;

  // minimum długości
  if (name.length < 3) return false;

  // musi zawierać literę
  if (!/[a-zA-Z]/.test(name)) return false;

  // ❌ odrzucamy typowe OCR śmieci
  if (/^[^a-zA-Z]+$/.test(name)) return false;

  return true;
}