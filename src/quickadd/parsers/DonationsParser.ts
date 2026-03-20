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

  if (donationLike >= 1) return true; // 🔥 ważne dla multiscreena

  const numbers = lines.filter(l => /\d{4,}/.test(l)).length;

  return numbers >= 3; // 🔥 mniej restrykcyjne
}

// =====================================
// 🔥 MAIN PARSER
// =====================================
export function parseDonations(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  let lastNickname: string | null = null;

  // 🔥 MULTISCREEN: usuń duplikaty i garbage upfront
  const cleanedLines = dedupeLines(lines);

  for (let rawLine of cleanedLines) {
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

      if (/^donat/i.test(nickname)) continue;

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

      if (!value || value < 1000 || value > 1000000) {
        continue; // 🔥 NIE resetuj nicka
      }

      const nickname = normalizeNickname(lastNickname || "");

      if (
        !nickname ||
        nickname.length < 2 ||
        nickname.toLowerCase() === "donations"
      ) {
        continue; // 🔥 nie kasuj nicka przez OCR śmieci
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

      if (!value || value < 1000 || value > 1000000) continue;

      const nickname = normalizeNickname(lastNickname || "");

      if (!nickname || nickname.length < 2) {
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

  return dedupeEntries(entries); // 🔥 klucz do multiscreena
}

// =====================================
// 🔥 MULTISCREEN: USUŃ DUPLIKATY LINII
// =====================================
function dedupeLines(lines: string[]): string[] {
  const seen = new Set<string>();

  return lines.filter(l => {
    const key = l.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// =====================================
// 🔥 MULTISCREEN: USUŃ DUPLIKATY ENTRY
// =====================================
function dedupeEntries(entries: QuickAddEntry[]): QuickAddEntry[] {
  const seen = new Set<string>();

  return entries.filter(e => {
    const key = `${e.nickname}_${e.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// =====================================
// 🧠 FUZZY DETECTION
// =====================================
function looksLikeDonations(line: string): boolean {
  return /donat|ionat|dona|tion/i.test(line);
}

// =====================================
// 🧠 NICKNAME CHECK (ULTRA FIX)
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

  if (/^\d+$/.test(line)) return false;

  if (/^[^a-zA-Z]*$/.test(line)) return false;

  return true;
}

// =====================================
// 💰 VALUE EXTRACT (ULTRA FIX)
// =====================================
function extractValue(line: string): number | null {
  let cleaned = line
    .replace(/[^\d\sKk]/g, "")
    .replace(/K/i, "000");

  cleaned = fixSplitNumbers(cleaned);

  const match = cleaned.match(/(\d{4,})/);
  if (!match) return null;

  const value = parseInt(match[1], 10);

  if (value > 1000000) return null; // 🔥 blok timestampów

  return value;
}

// =====================================
// 🔧 FIX: 43428 20 → 4342820
// =====================================
function fixSplitNumbers(str: string): string {
  return str.replace(/(\d{2,})\s+(\d{2,})/g, "$1$2");
}

// =====================================
// 🧹 GARBAGE FILTER (ULTRA)
// =====================================
function isGarbage(line: string): boolean {
  if (line.length < 3) return true;

  if (/^\d{9,}$/.test(line)) return true;

  if (/^[^a-zA-Z0-9]+$/.test(line)) return true;

  if (/^[A-Z]{1,2}$/.test(line)) return true;

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