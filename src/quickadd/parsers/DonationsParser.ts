// src/quickadd/parsers/DonationsParser.ts

import { QuickAddEntry } from "../types/QuickAddEntry";

export function parseDonations(lines: string[]): QuickAddEntry[] {
  console.log("=================================");
  console.log("🧠 DonationsParser START (V11 DEBUG)");
  console.log("=================================");

  let lineId = 1;

  const entries: QuickAddEntry[] = [];
  const cleanedLines = dedupeLines(lines);

  console.log("🧾 CLEANED LINES:");
  cleanedLines.forEach((l, i) => {
    console.log(`[${i}]`, l);
  });

  for (let i = 0; i < cleanedLines.length; i++) {
    let line = cleanedLines[i].trim();
    if (!line) continue;

    line = fixSplitNumbers(line);

    console.log(`\n🔎 [${i}] "${line}"`);

    if (isTimestamp(line)) {
      console.log("   ⛔ timestamp skipped");
      continue;
    }

    if (isGarbage(line)) {
      console.log("   🗑️ garbage skipped");
      continue;
    }

    if (looksLikeDonations(line) || hasBigNumber(line)) {
      const value = extractValue(line);

      console.log("   💰 value detected:", value);

      if (!value) {
        console.log("   ❌ value = null");
        continue;
      }

      const nickData = findNicknameAbove(cleanedLines, i);

      if (!nickData) {
        console.log("   ❌ no nickname found above");
        continue;
      }

      console.log("   ✅ ENTRY:", nickData.clean, value);

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
    } else {
      console.log("   ⏭️ not a value line");
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

// ================= LOOKBACK =================

function findNicknameAbove(
  lines: string[],
  index: number
): { raw: string; clean: string; confidence: number } | null {
  const MAX_LOOKBACK = 3;

  console.log("🔍 LOOKBACK START from index:", index);

  for (let i = 1; i <= MAX_LOOKBACK; i++) {
    const line = lines[index - i];

    console.log(`   checking [${index - i}]:`, line);

    if (!line) continue;

    if (!isNickname(line)) {
      console.log("   ❌ not nickname");
      continue;
    }

    const clean = normalizeNickname(line);

    console.log("   🧼 cleaned:", clean);

    if (!isValidNickname(clean)) {
      console.log("   ❌ invalid nickname");
      continue;
    }

    const confidence = 1 - (i - 1) * 0.2;

    console.log("   ✅ MATCH FOUND:", clean, "confidence:", confidence);

    return {
      raw: line,
      clean,
      confidence,
    };
  }

  console.log("   ❌ LOOKBACK FAILED");

  return null;
}

// ================= HELPERS =================

function isTimestamp(line: string): boolean {
  return /\d{8,}/.test(line);
}

function hasBigNumber(line: string): boolean {
  return /\d{4,}/.test(line);
}

// 🔥 LEPSZE EXTRACT + DEBUG
function extractValue(line: string): number | null {
  console.log("💰 EXTRACT RAW:", line);

  let raw = line.toLowerCase();

  // 43 300 → 43300
  raw = raw.replace(/(\d{2,})\s+(\d{3})/g, "$1$2");

  console.log("💰 AFTER SPLIT FIX:", raw);

  // K
  const kMatch = raw.match(/(\d+(?:\.\d+)?)\s*k/);
  if (kMatch) {
    const val = Math.round(parseFloat(kMatch[1]) * 1000);
    console.log("💰 K DETECTED:", val);
    return val;
  }

  raw = raw.replace(/[^\d\s]/g, "");

  console.log("💰 DIGITS ONLY:", raw);

  const matches = raw.match(/\d{2,6}/g);
  console.log("💰 MATCHES:", matches);

  if (!matches) return null;

  const values = matches
    .map(n => parseInt(n, 10))
    .filter(n => n >= 100);

  console.log("💰 FILTERED VALUES:", values);

  if (!values.length) return null;

  const final = Math.max(...values);

  console.log("💰 FINAL VALUE:", final);

  return final;
}

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
      console.log("🔁 MERGE:", e.nickname, existing?.value, "→", e.value);
      map.set(key, e);
    }
  }

  return Array.from(map.values());
}