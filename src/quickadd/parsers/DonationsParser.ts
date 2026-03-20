// src/quickadd/parsers/DonationsParser.ts

import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

// =====================================
// 🧠 CAN PARSE (FUZZY + FALLBACK)
// =====================================
export function canParseDonations(lines: string[]): boolean {
  const donationLike = lines.filter(l =>
    looksLikeDonations(l)
  ).length;

  // klasyczny przypadek
  if (donationLike >= 2) return true;

  // 🔥 fallback – ranking bez słowa "donations"
  const numbers = lines.filter(l => /\d{4,}/.test(l)).length;

  return numbers >= 5;
}

// =====================================
// 🔥 MAIN PARSER
// =====================================
export function parseDonations(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  let lastNickname: string | null = null;

  for (let rawLine of lines) {
    let line = rawLine.trim();
    if (!line) continue;

    line = fixSplitNumbers(line);

    if (isGarbage(line)) continue;

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
    if (looksLikeDonations(line)) {
      const value = extractValue(line);

      if (!value || value < 1000) {
        lastNickname = null;
        continue;
      }

      const nickname = normalizeNickname(lastNickname || "");

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
      continue;
    }

    // =========================
    // 🔥 FALLBACK: liczba bez "donations"
    // =========================
    const numberOnly = line.match(/(\d{4,})/);
    if (numberOnly) {
      const value = parseInt(numberOnly[1], 10);

      if (!value || value < 1000) continue;

      const nickname = normalizeNickname(lastNickname || "");

      if (!nickname || nickname.length < 2) {
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
        confidence: 0.7,
        sourceType: "OCR",
      });

      lastNickname = null;
    }
  }

  return entries;
}

// =====================================
// 🧠 FUZZY DETECTION
// =====================================
function looksLikeDonations(line: string): boolean {
  return /donat|ionat|dona|tion/i.test(line);
}

// =====================================
// 🧠 NICKNAME CHECK
// =====================================
function isNickname(line: string): boolean {
  const lower = line.toLowerCase();

  if (
    looksLikeDonations(line) ||
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
// 💰 VALUE EXTRACT (ODPORNY)
// =====================================
function extractValue(line: string): number | null {
  const match = line.match(/([\d\s]{4,})/);
  if (!match) return null;

  const value = parseInt(match[1].replace(/\s/g, ""), 10);
  return isNaN(value) ? null : value;
}

// =====================================
// 🔧 FIX: 43428 20 → 4342820
// =====================================
function fixSplitNumbers(str: string): string {
  return str.replace(/(\d{2,})\s+(\d{2,})/g, "$1$2");
}

// =====================================
// 🧹 GARBAGE FILTER
// =====================================
function isGarbage(line: string): boolean {
  if (line.length < 3) return true;
  if (/^[^a-zA-Z0-9]+$/.test(line)) return true;
  return false;
}

// =====================================
// 🔥 FINAL NICKNAME CLEANER
// =====================================
function normalizeNickname(name: string): string {
  let cleaned = name.trim();

  cleaned = cleaned.replace(/^[A-Za-z]?\s*\d*\s+/, "");
  cleaned = cleaned.replace(/^[a-z]\s+/i, "");
  cleaned = cleaned.replace(/^[a-z]\d+\s+/i, "");
  cleaned = cleaned.replace(/^\d+\s+/i, "");

  cleaned = cleaned.replace(/[<>]/g, "");
  cleaned = cleaned.replace(/^[^a-zA-Z]+/, "");
  cleaned = cleaned.replace(/\s+[a-z]$/i, "");

  cleaned = cleaned.replace(/[^\w\d_]/g, "");

  return cleaned.trim();
}