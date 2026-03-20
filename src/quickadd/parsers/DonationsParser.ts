// src/quickadd/parsers/DonationsParser.ts

import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

// =====================================
// 🧠 CAN PARSE (TYLKO DO SCREENÓW)
// =====================================
export function canParseDonations(lines: string[]): boolean {
  const hits = lines.filter(l =>
    l.toLowerCase().includes("donations")
  ).length;

  return hits >= 2;
}

// =====================================
// 🔥 MAIN PARSER
// =====================================
export function parseDonations(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  let lastNickname: string | null = null;

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // =========================
    // ✍️ TRYB TEKSTOWY (manual)
    // =========================
    const manualMatch = line.match(/^(.+?)\s+(\d{3,})$/);
    if (manualMatch) {
      const nickname = normalizeNickname(manualMatch[1]);
      const value = parseInt(manualMatch[2], 10);

      if (!nickname || isNaN(value)) continue;

      entries.push({
        lineId: lineCounter++,
        nickname,
        value,
        raw: rawLine,
        rawText: rawLine,
        status: "OK",
        confidence: 1,
        sourceType: "MANUAL",
      });

      continue;
    }

    // =========================
    // 🧠 DETECT NICK (OCR)
    // =========================
    if (isNickname(line)) {
      const cleanedNick = normalizeNickname(line);

      if (cleanedNick.length >= 3) {
        lastNickname = cleanedNick;
      }

      continue;
    }

    // =========================
    // 💰 DONATIONS LINE (OCR)
    // =========================
    if (/donations/i.test(line)) {
      const value = extractValue(line);

      if (!value || value < 1000) {
        lastNickname = null;
        continue;
      }

      const nickname = normalizeNickname(lastNickname || "");

      // ❌ zabezpieczenia
      if (
        !nickname ||
        nickname.length < 2 ||
        nickname.toLowerCase() === "donations"
      ) {
        lastNickname = null;
        continue;
      }

      entries.push({
        lineId: lineCounter++,
        nickname,
        value,
        raw: rawLine,
        rawText: `${lastNickname ?? "??"} | ${line}`,
        status: "OK",
        confidence: 1,
        sourceType: "OCR",
      });

      lastNickname = null;
    }
  }

  return entries;
}

// =====================================
// 🧠 NICKNAME CHECK (ULEPSZONE)
// =====================================
function isNickname(line: string): boolean {
  const lower = line.toLowerCase();

  if (
    lower.includes("donations") ||
    lower.includes("ranking") ||
    lower.includes("total") ||
    lower.includes("alliance")
  ) return false;

  if (line.length < 3) return false;

  if (!/[a-z]/i.test(line)) return false;

  const digitCount = (line.match(/\d/g) || []).length;
  if (digitCount > 3) return false;

  if (/^[^a-zA-Z]*$/.test(line)) return false;

  return true;
}

// =====================================
// 💰 VALUE EXTRACT
// =====================================
function extractValue(line: string): number | null {
  const match = line.match(/donations[:\s]*([\d\s]+)/i);
  if (!match) return null;

  const value = parseInt(match[1].replace(/\s/g, ""), 10);
  return isNaN(value) ? null : value;
}

// =====================================
// 🔥 FINAL NICKNAME CLEANER
// =====================================
function normalizeNickname(name: string): string {
  let cleaned = name.trim();

  // 🔥 usuń prefixy typu "S 4", "R ", "a4"
  cleaned = cleaned.replace(/^[A-Za-z]?\s*\d*\s+/, "");

  // 🔥 stare fixy
  cleaned = cleaned.replace(/^[a-z]\s+/i, "");
  cleaned = cleaned.replace(/^[a-z]\d+\s+/i, "");
  cleaned = cleaned.replace(/^\d+\s+/i, "");

  // 🔥 dekoracje
  cleaned = cleaned.replace(/[<>]/g, "");

  // 🔥 leading garbage
  cleaned = cleaned.replace(/^[^a-zA-Z]+/, "");

  // 🔥 końcówki OCR
  cleaned = cleaned.replace(/\s+[a-z]$/i, "");

  // 🔥 final clean
  cleaned = cleaned.replace(/[^\w\d_]/g, "");

  return cleaned.trim();
}