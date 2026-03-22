// =====================================
// 📁 src/quickadd/parsing/donations/DonationsParser.ts
// =====================================

import { debug } from "../../debug/DebugLogger";

const SCOPE = "PARSER";

export interface ParsedEntry {
  nickname: string;
  value: number;
  raw?: string;
}

export function parseDonations(lines: string[]): ParsedEntry[] {
  const cleaned = lines
    .map(cleanLine)
    .filter((l) => l.length > 0);

  debug(SCOPE, "CLEANED_LINES", cleaned);

  const entries: ParsedEntry[] = [];

  let currentNick: string | null = null;

  for (let i = 0; i < cleaned.length; i++) {
    const line = cleaned[i];

    // =============================
    // 🔢 VALUE LINE (Donations)
    // =============================
    const value = extractValue(line);

    if (value !== null) {
      if (currentNick) {
        entries.push({
          nickname: currentNick,
          value,
          raw: line,
        });

        debug(SCOPE, "PAIR", {
          nickname: currentNick,
          value,
        });

        currentNick = null;
      }

      continue;
    }

    // =============================
    // 👤 NICK LINE
    // =============================
    if (isValidNickname(line)) {
      currentNick = line;
      debug(SCOPE, "NICK_DETECTED", line);
    }
  }

  return entries;
}

// =====================================
// 🧹 CLEAN LINE
// =====================================
function cleanLine(line: string): string {
  return line
    .replace(/[^\w\s,]/g, "") // usuń śmieci
    .replace(/\s+/g, " ")
    .trim();
}

// =====================================
// 🔢 EXTRACT VALUE
// =====================================
function extractValue(line: string): number | null {
  if (!line.toLowerCase().includes("donations")) return null;

  const match = line.match(/([\d\s,]+)/);

  if (!match) return null;

  const raw = match[1]
    .replace(/\s/g, "")
    .replace(/,/g, "");

  const value = parseInt(raw, 10);

  if (isNaN(value)) return null;

  return value;
}

// =====================================
// 👤 NICK VALIDATION
// =====================================
function isValidNickname(line: string): boolean {
  if (line.length < 3) return false;

  // ❌ odrzucamy linie systemowe
  if (line.toLowerCase().includes("donations")) return false;
  if (line.toLowerCase().includes("ranking")) return false;
  if (line.toLowerCase().includes("reward")) return false;

  // ❌ same cyfry → nie nick
  if (/^\d+$/.test(line)) return false;

  return true;
}