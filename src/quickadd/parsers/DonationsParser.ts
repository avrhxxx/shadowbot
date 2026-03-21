// src/quickadd/parsers/DonationsParser.ts

import { QuickAddEntry } from "../types/QuickAddEntry";

export function parseDonations(lines: string[]): QuickAddEntry[] {
  console.log("=================================");
  console.log("🧠 DonationsParser START (V10)");
  console.log("=================================");

  let lineId = 1; // 🔥 LOCAL (FIX)

  const entries: QuickAddEntry[] = [];
  const cleanedLines = dedupeLines(lines);

  for (let i = 0; i < cleanedLines.length; i++) {
    let line = cleanedLines[i].trim();
    if (!line) continue;

    line = fixSplitNumbers(line);

    console.log(`🔎 [${i}] "${line}"`);

    if (isTimestamp(line)) {
      console.log("   ⛔ timestamp skipped");
      continue;
    }

    if (isGarbage(line)) continue;

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
        lineId: lineId++, // 🔥 FIX
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

  return finalEntries;
}

// ================= LOOKBACK =================

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

    return { raw: line, clean, confidence };
  }

  return null;
}

// ================= HELPERS =================

function isTimestamp(line: string): boolean {
  return /\d{8,}/.test(line);
}

function hasBigNumber(line: string): boolean {
  return /\d{4,}/.test(line);
}

// 🔥 LEPSZE EXTRACT
function extractValue(line: string): number | null {
  let raw = line.toLowerCase();

  // 43 300 → 43300 (tylko jeśli wygląda jak split number)
  raw = raw.replace(/(\d{2,})\s+(\d{3})/g, "$1$2");

  // K
  const kMatch = raw.match(/(\d+(?:\.\d+)?)\s*k/);
  if (kMatch) {
    return Math.round(parseFloat(kMatch[1]) * 1000);
  }

  raw = raw.replace(/[^\d\s]/g, "");

  const matches = raw.match(/\d{2,6}/g);
  if (!matches) return null;

  const values = matches
    .map(n => parseInt(n, 10))
    .filter(n => n >= 100); // 🔥 niższy próg

  if (!values.length) return null;

  return Math.max(...values);
}

// 🔥 mniej agresywne
function fixSplitNumbers(str: string): string {
  return str.replace(/(\d{2,})\s+(\d{3})/g, "$1$2");
}

function looksLikeDonations(line: string): boolean {
  return /donat|ionat|dona|tion/i.test(line);
}

function isNickname(line: string): boolean {
  const lower = line.toLowerCase();

  if (
    looksLikeDonations(line) ||
    lower.includes("ranking") ||
    lower.includes("reward")
  ) return false;

  if (line.length < 3) return false;

  if (!/[a-z]{2,}/i.test(line)) return false;

  const digitCount = (line.match(/\d/g) || []).length;
  if (digitCount > 3) return false;

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
  return name
    .trim()
    .replace(/^[^a-zA-Z]+/, "")
    .replace(/[^\p{L}\p{N}_]/gu, "")
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