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
// 🚀 MAIN PARSER (V5 - MULTISCREEN READY)
// =====================================
export function parseDonations(lines: string[]): QuickAddEntry[] {
  console.log("=================================");
  console.log("🧠 DonationsParser START (V5)");
  console.log("=================================");

  const entries: QuickAddEntry[] = [];

  // 🔥 zamiast lastNickname
  let nicknameQueue: string[] = [];

  const cleanedLines = dedupeLines(lines);

  for (let i = 0; i < cleanedLines.length; i++) {
    const rawLine = cleanedLines[i];
    let line = rawLine.trim();

    if (!line) continue;

    line = fixSplitNumbers(line);

    console.log(`🔎 [${i}] "${line}"`);
    console.log("   queue:", nicknameQueue);

    if (isGarbage(line)) {
      console.log("   ❌ garbage");
      continue;
    }

    // =========================
    // 💰 DONATIONS (TOP PRIORITY)
    // =========================
    if (looksLikeDonations(line)) {
      const value = extractValue(line);

      console.log("   💰 donations detected, value:", value);

      if (!value) {
        console.log("   ❌ value rejected");
        continue;
      }

      const nickname = nicknameQueue.shift();

      if (!nickname) {
        console.log("   ❌ no nickname in queue");
        continue;
      }

      console.log("   ✅ ENTRY:", nickname, value);

      entries.push({
        lineId: lineCounter++,
        nickname,
        value,
        raw: rawLine,
        rawText: `${nickname} | ${line}`,
        status: "OK",
        confidence: 1,
        sourceType: "OCR",
      });

      continue;
    }

    // =========================
    // ✍️ MANUAL (SAFE)
    // =========================
    const manualMatch = line.match(/^(.+?)\s+(\d{3,})$/);
    if (manualMatch) {
      const rawNick = manualMatch[1];

      if (looksLikeDonations(rawNick)) {
        console.log("   ❌ manual rejected (donation keyword)");
        continue;
      }

      const nickname = normalizeNickname(rawNick);
      const value = parseInt(manualMatch[2], 10);

      if (!nickname || isNaN(value)) continue;
      if (value < 1000 || value > 200000) continue;

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
    // 🧠 NICKNAME
    // =========================
    if (isNickname(line)) {
      const cleanedNick = normalizeNickname(line);

      if (isValidNickname(cleanedNick)) {
        console.log("   👤 nickname detected:", cleanedNick);
        nicknameQueue.push(cleanedNick);
      }

      continue;
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

// =====================================
// 🔥 HELPERS
// =====================================

function extractValue(line: string): number | null {
  let raw = line.toLowerCase();

  // 🔥 K support (43K, 43 0K etc.)
  const kMatch = raw.match(/(\d{2,})\s*0*\s*k/);
  if (kMatch) {
    const val = parseInt(kMatch[1], 10) * 1000;
    if (val >= 1000 && val <= 200000) return val;
  }

  // usuń śmieci
  raw = raw.replace(/[^\d\s]/g, "");
  raw = fixSplitNumbers(raw);

  const matches = raw.match(/\d{4,6}/g);
  if (!matches) return null;

  const values = matches
    .map(n => parseInt(n, 10))
    .filter(n => n >= 1000 && n <= 200000);

  if (values.length === 0) return null;

  return Math.max(...values);
}

function fixSplitNumbers(str: string): string {
  return str.replace(/(\d{2,})\s+(\d{2,})/g, "$1$2");
}

function looksLikeDonations(line: string): boolean {
  return /donat|ionat|dona|tion/i.test(line);
}

function isNickname(line: string): boolean {
  const lower = line.toLowerCase();

  if (
    looksLikeDonations(line) ||
    lower.includes("ranking") ||
    lower.includes("reward") ||
    lower.includes("total")
  ) return false;

  if (line.length < 3) return false;
  if (!/[a-z]/i.test(line)) return false;

  const digitCount = (line.match(/\d/g) || []).length;
  if (digitCount > 3) return false;

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

  // usuń prefixy typu "S 4", "R ", "a4"
  cleaned = cleaned.replace(/^[^a-zA-Z]+/, "");
  cleaned = cleaned.replace(/^[a-z]\d+\s+/i, "");

  // usuń śmieci
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
  const seen = new Set<string>();

  return entries.filter(e => {
    const key = `${e.nickname}_${e.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}