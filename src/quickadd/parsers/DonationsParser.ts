// src/quickadd/parsers/DonationsParser.ts

import { QuickAddEntry } from "../types/QuickAddEntry";

export function parseDonations(lines: string[]): QuickAddEntry[] {
  console.log("=================================");
  console.log("🧠 DonationsParser START (V14)");
  console.log("=================================");

  let lineId = 1;
  const entries: QuickAddEntry[] = [];
  const cleanedLines = dedupeLines(lines);

  for (let i = 0; i < cleanedLines.length; i++) {
    let line = cleanedLines[i].trim();
    if (!line) continue;

    line = fixSplitNumbers(line);
    line = removeOcrNoise(line); // 🔥 NEW

    console.log(`\n🔎 [${i}] "${line}"`);

    if (isTimestamp(line) || isGarbage(line) || isSystemLine(line)) {
      console.log("   ⛔ skipped");
      continue;
    }

    // =========================
    // 🔥 1. DONATIONS LINE
    // =========================
    if (isDonationsLine(line)) {
      const value = extractValueSafe(line); // 🔥 FIXED
      if (!value) continue;

      const nickData = findNicknameAboveSmart(cleanedLines, i);

      if (!nickData) {
        console.log("   ⚠️ no nickname found");
        continue;
      }

      console.log("   ✅ DONATION ENTRY:", nickData.clean, value);

      entries.push({
        lineId: lineId++,
        nickname: nickData.clean,
        value,
        raw: nickData.raw,
        rawText: `${nickData.raw} | ${line}`,
        status: "OK",
        confidence: nickData.confidence,
        sourceType: "OCR",
      });

      continue;
    }

    // =========================
    // ⚡ 2. INLINE PARSE (lepszy)
    // =========================
    const inline = parseInline(line);
    if (inline) {
      console.log("   ⚡ INLINE MATCH:", inline.nick, inline.value);

      entries.push({
        lineId: lineId++,
        nickname: inline.nick,
        value: inline.value,
        raw: line,
        rawText: line,
        status: "OK",
        confidence: 0.7,
        sourceType: "OCR",
      });

      continue;
    }
  }

  const finalEntries = sanitizeEntries(dedupeEntries(entries)); // 🔥 NEW

  console.log("=================================");
  console.log("📊 FINAL ENTRIES:", finalEntries.length);
  console.log("=================================");

  return finalEntries;
}

//
// ================= CORE DETECTION =================
//

function isDonationsLine(line: string): boolean {
  return /donations/i.test(line);
}

function isSystemLine(line: string): boolean {
  return (
    /at least/i.test(line) ||
    /required/i.test(line) ||
    /rewards/i.test(line) ||
    /ranking/i.test(line)
  );
}

//
// ================= INLINE PARSER =================
//

function parseInline(line: string): { nick: string; value: number } | null {
  const fixed = fixSplitNumbers(removeOcrNoise(line));

  const match = fixed.match(/([^\d]{3,}?)\s*(\d{4,7})/);
  if (!match) return null;

  const rawNick = match[1];
  const value = normalizeValue(parseInt(match[2], 10));

  const clean = normalizeNickname(rawNick);
  if (!isValidNickname(clean)) return null;

  return { nick: clean, value };
}

//
// ================= SMART LOOKBACK =================
//

function findNicknameAboveSmart(
  lines: string[],
  index: number
): { raw: string; clean: string; confidence: number } | null {
  console.log("🔍 SMART LOOKBACK");

  for (let i = 1; i <= 5; i++) {
    const line = lines[index - i];
    if (!line) continue;

    if (isDonationsLine(line)) continue;
    if (isSystemLine(line)) continue;
    if (isGarbage(line)) continue;

    if (!isNickname(line)) continue;

    const clean = normalizeNickname(line);
    if (!isValidNickname(clean)) continue;

    const confidence = 1 - i * 0.1;

    console.log("   ✅ FOUND:", clean);

    return {
      raw: line,
      clean,
      confidence,
    };
  }

  return null;
}

//
// ================= HELPERS =================
//

function isTimestamp(line: string): boolean {
  return /\d{4}-\d{2}|\d{2}:\d{2}/.test(line);
}

// 🔥 GŁÓWNY FIX LICZB
function extractValueSafe(line: string): number | null {
  let raw = removeOcrNoise(line.toLowerCase());

  // K / M support
  const kMatch = raw.match(/(\d+(?:\.\d+)?)\s*k/);
  if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000);

  const mMatch = raw.match(/(\d+(?:\.\d+)?)\s*m/);
  if (mMatch) return Math.round(parseFloat(mMatch[1]) * 1_000_000);

  raw = raw.replace(/[^\d]/g, "");
  if (raw.length < 4) return null;

  return normalizeValue(parseInt(raw, 10));
}

// 🔥 NORMALIZACJA (usuwa x10 OCR bug)
function normalizeValue(num: number): number {
  if (num > 1_000_000) return Math.floor(num / 100);
  if (num > 500_000) return Math.floor(num / 10);
  return num;
}

// 🔥 USUWANIE OCR ŚMIECI
function removeOcrNoise(str: string): string {
  return str
    .replace(/\(\d+\s*[A-Za-z]*\)/g, "") // (20 Qg)
    .replace(/[^\x00-\x7F]/g, "") // dziwne znaki
    .replace(/[_~`]/g, "")
    .trim();
}

function fixSplitNumbers(str: string): string {
  return str.replace(/(\d{2,})\s+(\d{3})/g, "$1$2");
}

function isNickname(line: string): boolean {
  if (line.length < 3) return false;
  if (!/[a-zA-Z]/.test(line)) return false;
  if (/\d{4,}/.test(line)) return false;
  return true;
}

function isValidNickname(nick: string): boolean {
  if (!nick || nick.length < 3) return false;
  if (/^\d+$/.test(nick)) return false;
  return true;
}

function isGarbage(line: string): boolean {
  if (line.length < 2) return true;
  if (/^[^a-zA-Z0-9]+$/.test(line)) return true;
  return false;
}

// 🔥 LEPSZY CLEAN NICKA
function normalizeNickname(name: string): string {
  return name
    .trim()
    .replace(/^[^a-zA-Z0-9]+/, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .replace(/^[0-9]+/, "") // usuń rank
    .replace(/g$/, "") // OCR tail
    .trim();
}

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
  const map = new Map<string, QuickAddEntry>();

  for (const e of entries) {
    const key = e.nickname.toLowerCase();

    const existing = map.get(key);

    if (!existing || e.value > existing.value) {
      map.set(key, e);
    }
  }

  return Array.from(map.values());
}

// 🔥 FINAL FILTER
function sanitizeEntries(entries: QuickAddEntry[]): QuickAddEntry[] {
  return entries.filter(e => {
    if (!e.value) return false;
    if (e.value < 1000) return false;
    if (e.value > 1_000_000) return false;
    return true;
  });
}