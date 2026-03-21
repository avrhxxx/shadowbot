// src/quickadd/parsers/DonationsParser.ts

import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

export function parseDonations(lines: string[]): QuickAddEntry[] {
  console.log("=================================");
  console.log("🧠 DonationsParser START (V9 FIXED)");
  console.log("=================================");

  const entries: QuickAddEntry[] = [];
  const cleanedLines = dedupeLines(lines);

  for (let i = 0; i < cleanedLines.length; i++) {
    let line = cleanedLines[i].trim();
    if (!line) continue;

    line = fixSplitNumbers(line);

    console.log(`🔎 [${i}] "${line}"`);

    // 🔥 FIX 1 — skip timestampy
    if (isTimestamp(line)) {
      console.log("   ⛔ timestamp skipped");
      continue;
    }

    if (isGarbage(line)) continue;

    // =========================
    // 💰 VALUE LINE
    // =========================
    if (looksLikeDonations(line) || hasBigNumber(line)) {
      const value = extractValue(line);

      console.log("   💰 value detected:", value);

      if (!value) continue;

      const nickData = findNicknameAbove(cleanedLines, i);

      if (!nickData) {
        console.log("   ❌ no nickname found above");
        continue;
      }

      console.log("   ✅ ENTRY:", nickData.clean, value);

      entries.push({
        lineId: lineCounter++,
        nickname: nickData.clean,
        value,
        raw: nickData.raw,
        rawText: `${nickData.raw} | ${line}`,
        status: "OK",
        confidence: nickData.confidence,
        sourceType: "OCR",
      });
    }
  }

  const finalEntries = dedupeEntries(entries);

  console.log("=================================");
  console.log("📊 FINAL ENTRIES:", finalEntries.length);
  console.log("=================================");

  finalEntries.forEach((e, i) => {
    console.log(`[${i}] ${e.nickname} → ${e.value}`);
  });

  return finalEntries;
}

// ================= 🔥 LOOKBACK =================

function findNicknameAbove(
  lines: string[],
  index: number
): { raw: string; clean: string; confidence: number } | null {
  const MAX_LOOKBACK = 3;

  for (let i = 1; i <= MAX_LOOKBACK; i++) {
    const line = lines[index - i];
    if (!line) continue;

    if (!isNickname(line)) continue;

    const clean = normalizeNickname(line);

    if (!isValidNickname(clean)) continue;

    const confidence = 1 - (i - 1) * 0.2;

    return {
      raw: line,
      clean,
      confidence,
    };
  }

  return null;
}

// ================= 🔥 HELPERS =================

// 🔥 FIX 1 — timestamp detector
function isTimestamp(line: string): boolean {
  return /\d{8,}/.test(line);
}

function hasBigNumber(line: string): boolean {
  return /\d{4,}/.test(line);
}

// 🔥 FIX 2 — poprawione value extraction
function extractValue(line: string): number | null {
  let raw = line.toLowerCase();

  // 🔥 43 30K → 43300
  raw = raw.replace(/(\d{2,})\s+(\d{2,})\s*k/, (_, a, b) => {
    return String(parseInt(a + b, 10) * 1000);
  });

  // 🔥 klasyczny K
  const kMatch = raw.match(/(\d{2,})\s*k/);
  if (kMatch) {
    return parseInt(kMatch[1], 10) * 1000;
  }

  raw = raw.replace(/[^\d\s]/g, "");
  raw = fixSplitNumbers(raw);

  const matches = raw.match(/\d{4,6}/g);
  if (!matches) return null;

  const values = matches
    .map(n => parseInt(n, 10))
    .filter(n => n >= 1000 && n <= 200000);

  if (!values.length) return null;

  return Math.max(...values);
}

function fixSplitNumbers(str: string): string {
  return str.replace(/(\d{2,})\s+(\d{2,})/g, "$1$2");
}

function looksLikeDonations(line: string): boolean {
  return /donat|ionat|dona|tion/i.test(line);
}

// 🔥 FIX 3 — lepszy nickname filter
function isNickname(line: string): boolean {
  const lower = line.toLowerCase();

  if (
    looksLikeDonations(line) ||
    lower.includes("ranking") ||
    lower.includes("reward")
  ) return false;

  if (line.length < 3) return false;

  // 🔥 musi mieć min 2 litery obok siebie
  if (!/[a-z]{2,}/i.test(line)) return false;

  // 🔥 max 3 cyfry
  const digitCount = (line.match(/\d/g) || []).length;
  if (digitCount > 3) return false;

  // 🔥 eliminacja śmieci typu "T v"
  if (line.split(" ").length > 3) return false;

  return true;
}

function isValidNickname(nick: string): boolean {
  if (!nick || nick.length < 3) return false;
  if (/^\d+$/.test(nick)) return false;
  return true;
}

function isGarbage(line: string): boolean {
  if (line.length < 3) return true;
  if (/^\d{9,}$/.test(line)) return true;
  if (/^[^a-zA-Z0-9]+$/.test(line)) return true;
  return false;
}

function normalizeNickname(name: string): string {
  let cleaned = name.trim();

  cleaned = cleaned.replace(/^[^a-zA-Z]+/, "");
  cleaned = cleaned.replace(/[^\p{L}\p{N}_]/gu, "");

  return cleaned.trim();
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