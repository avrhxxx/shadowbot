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

    const rawValue = match[1]; // np. "82,969" lub "58 396"

    // =============================
    // 🧠 PARSOWANIE LICZBY
    // =============================
    const value = parseNumber(rawValue);

    const nextLine = lines[i + 1] || "";

    // =============================
    // 🧼 CLEAN NICKNAME
    // =============================
    const nickname = cleanNickname(nextLine);

    // =============================
    // ❌ VALIDATION
    // =============================
    if (!isValidNickname(nickname) || isNaN(value)) {
      debugTrace(SCOPE, "SKIPPED_ENTRY", traceId, {
        line,
        nextLine,
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
// 🧠 NUMBER PARSER
// =====================================
function parseNumber(raw: string): number {
  return parseInt(
    raw
      .replace(/[^\d]/g, "") // usuń wszystko oprócz cyfr
  );
}

// =====================================
// 🧼 CLEAN FUNCTION
// =====================================
function cleanNickname(name: string): string {
  return name
    // usuń śmieci z początku (np. "4 ", "@ ", "Y ")
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

  // musi zawierać literę (eliminuje "123", ">l", itp.)
  if (!/[a-zA-Z]/.test(name)) return false;

  return true;
}