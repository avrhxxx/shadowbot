// src/quickadd/parsers/DonationsParser.ts

import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

// =====================================
// 🧠 CAN PARSE
// =====================================
export function canParseDonations(lines: string[]): boolean {
  const donationLike = lines.filter(l => looksLikeDonations(l)).length;

  if (donationLike >= 1) return true;

  const numbers = lines.filter(l => /\d{4,}/.test(l)).length;

  return numbers >= 3;
}

// =====================================
// 🔥 MAIN PARSER (V2 - MULTISCREEN SAFE)
// =====================================
export function parseDonations(lines: string[]): QuickAddEntry[] {
  console.log("=================================");
  console.log("🧠 DonationsParser START");
  console.log("=================================");

  const entries: QuickAddEntry[] = [];

  let lastNickname: string | null = null;

  const cleanedLines = dedupeLines(lines);

  console.log("📥 Lines after dedupe:", cleanedLines.length);

  for (let i = 0; i < cleanedLines.length; i++) {
    const rawLine = cleanedLines[i];
    let line = rawLine.trim();

    if (!line) continue;

    line = fixSplitNumbers(line);

    console.log(`🔎 [${i}] "${line}"`);
    console.log("   lastNickname:", lastNickname);

    if (isGarbage(line)) {
      console.log("   ❌ garbage");
      continue;
    }

    // =========================
    // ✍️ MANUAL
    // =========================
    const manualMatch = line.match(/^(.+?)\s+(\d{3,})$/);
    if (manualMatch) {
      const nickname = normalizeNickname(manualMatch[1]);
      const value = parseInt(manualMatch[2], 10);

      if (!nickname || isNaN(value)) continue;

      console.log("   ✅ MANUAL:", nickname, value);

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
    // 💰 DONATIONS LINE
    // =========================
    if (looksLikeDonations(line)) {
      const value = extractValue(line);

      console.log("   💰 donations detected, value:", value);

      if (!value || value < 1000 || value > 1000000) {
        console.log("   ❌ value rejected");
        continue;
      }

      const nickname = normalizeNickname(lastNickname || "");

      if (!nickname || nickname.length < 2) {
        console.log("   ❌ invalid nickname");
        continue;
      }

      console.log("   ✅ ENTRY:", nickname, value);

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

      // 🔥 NIE resetujemy agresywnie (multiscreen fix)
      continue;
    }

    // =========================
    // 🔥 NUMBER ONLY FALLBACK
    // =========================
    const numberOnly = line.match(/(\d{4,})/);
    if (numberOnly) {
      const value = parseInt(numberOnly[1], 10);

      if (!value || value < 1000 || value > 1000000) {
        continue;
      }

      const nickname = normalizeNickname(lastNickname || "");

      if (!nickname || nickname.length < 2) {
        continue;
      }

      console.log("   ⚠️ FALLBACK ENTRY:", nickname, value);

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

      continue;
    }

    // =========================
    // 🧠 NICKNAME DETECTION
    // =========================
    if (isNickname(line)) {
      const cleanedNick = normalizeNickname(line);

      if (cleanedNick.length >= 3) {
        console.log("   👤 nickname detected:", cleanedNick);
        lastNickname = cleanedNick;
      }

      continue;
    }
  }

  const finalEntries = dedupeEntries(entries);

  console.log("=================================");
  console.log("📊 FINAL ENTRIES:", finalEntries.length);
  finalEntries.forEach((e, i) => {
    console.log(`[${i}] ${e.nickname} → ${e.value}`);
  });
  console.log("=================================");

  return finalEntries;
}

// =====================================
// 🔥 HELPERS
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

function dedupeEntries(entries: QuickAddEntry[]): QuickAddEntry[] {
  const seen = new Set<string>();

  return entries.filter(e => {
    const key = `${e.nickname}_${e.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function looksLikeDonations(line: string): boolean {
  return /donat|ionat|dona|tion/i.test(line);
}

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

  return true;
}

// 🔥 NAJWAŻNIEJSZY FIX
function extractValue(line: string): number | null {
  let cleaned = line
    .replace(/[^\d\sKk]/g, "")
    .replace(/K/gi, "000");

  cleaned = fixSplitNumbers(cleaned);

  const numbers = cleaned.match(/\d{3,}/g);
  if (!numbers) return null;

  const values = numbers
    .map(n => parseInt(n, 10))
    .filter(n => !isNaN(n));

  if (values.length === 0) return null;

  const max = Math.max(...values);

  if (max > 1000000) return null;

  return max;
}

function fixSplitNumbers(str: string): string {
  return str.replace(/(\d{2,})\s+(\d{2,})/g, "$1$2");
}

function isGarbage(line: string): boolean {
  if (line.length < 3) return true;

  if (/^\d{9,}$/.test(line)) return true;

  if (/^[^a-zA-Z0-9]+$/.test(line)) return true;

  if (/^[A-Z]{1,2}$/.test(line)) return true;

  return false;
}

// 🔥 LEPSZY CLEANER
function normalizeNickname(name: string): string {
  let cleaned = name.trim();

  cleaned = cleaned.replace(/^[^a-zA-Z]+/, "");
  cleaned = cleaned.replace(/^[A-Za-z]\s*\d+\s+/, "");
  cleaned = cleaned.replace(/^[a-z]\s+/i, "");

  cleaned = cleaned.replace(/\s+[a-z]$/i, "");

  cleaned = cleaned.replace(/[^\p{L}\p{N}_]/gu, "");

  return cleaned.trim();
}