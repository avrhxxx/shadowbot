
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
    const match = line.match(/Donations:\s*([\d\s]+)/i);

    if (!match) continue;

    const rawValue = match[1]; // np. "58 396"
    const value = parseInt(rawValue.replace(/\s/g, ""));

    const nextLine = lines[i + 1] || "";

    // =============================
    // 🧼 CLEAN NICKNAME
    // =============================
    const nickname = cleanNickname(nextLine);

    // =============================
    // ❌ VALIDATION
    // =============================
    if (!nickname || isNaN(value)) {
      debugTrace(SCOPE, "SKIPPED_ENTRY", traceId, {
        line,
        nextLine,
        rawValue,
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
// 🧼 CLEAN FUNCTION
// =====================================
function cleanNickname(name: string): string {
  return name
    .replace(/^[^a-zA-Z0-9]+/, "")
    .replace(/[^a-zA-Z0-9]+$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}