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
// 🔥 MAIN PARSER (V4 - MULTISCREEN READY)
// =====================================
export function parseDonations(lines: string[]): QuickAddEntry[] {
  console.log("=================================");
  console.log("🧠 DonationsParser START (V4)");
  console.log("=================================");

  const entries: QuickAddEntry[] = [];
  let lastNickname: string | null = null;

  const cleanedLines = dedupeLines(lines);

  for (let i = 0; i < cleanedLines.length; i++) {
    const rawLine = cleanedLines[i];
    let line = rawLine.trim();

    if (!line) continue;

    line = normalizeLine(line);

    console.log(`🔎 [${i}] "${line}"`);
    console.log("   lastNickname:", lastNickname);

    if (isGarbage(line)) {
      console.log("   ❌ garbage");
      continue;
    }

    // =========================
    // 💰 DONATIONS (PRIORITY)
    // =========================
    if (looksLikeDonations(line)) {
      const value = extractValue(line);

      console.log("   💰 donations detected, value:", value);

      if (!value || value < 1000 || value > 200000) {
        console.log("   ❌ value rejected");
        continue;
      }

      const nickname = normalizeNickname(lastNickname || "");

      if (!isValidNickname(nickname)) {
        console.log("   ❌ invalid nickname");
        continue;
      }

      console.log("   ✅ ENTRY:", nickname, value);

      entries.push(buildEntry(nickname, value, rawLine, lastNickname, line, "OCR", 1));
      continue;
    }

    // =========================
    // ✍️ MANUAL (STRONG)
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

      if (!isValidNickname(nickname) || isNaN(value)) continue;

      console.log("   ✅ MANUAL:", nickname, value);

      entries.push(buildEntry(nickname, value, rawLine, rawNick, line, "MANUAL", 1));
      continue;
    }

    // =========================
    // 🔥 NUMBER FALLBACK (SMART)
    // =========================
    const numberOnly = extractValue(line);

    if (numberOnly) {
      const nickname = normalizeNickname(lastNickname || "");

      if (!isValidNickname(nickname)) continue;

      console.log("   ⚠️ FALLBACK ENTRY:", nickname, numberOnly);

      entries.push(buildEntry(nickname, numberOnly, rawLine, lastNickname, line, "OCR", 0.6));
      continue;
    }

    // =========================
    // 🧠 NICKNAME
    // =========================
    if (isNickname(line)) {
      const cleanedNick = normalizeNickname(line);

      if (isValidNickname(cleanedNick)) {
        console.log("   👤 nickname detected:", cleanedNick);
        lastNickname = cleanedNick;
      }

      continue;
    }
  }

  const final = dedupeEntries(entries);

  console.log("=================================");
  console.log("📊 FINAL ENTRIES:", final.length);
  console.log("=================================");

  final.forEach((e, i) => {
    console.log(`[${i}] ${e.nickname} → ${e.value}`);
  });

  return final;
}

// =====================================
// 🔥 ENTRY BUILDER
// =====================================
function buildEntry(
  nickname: string,
  value: number,
  raw: string,
  lastNickname: string | null,
  line: string,
  sourceType: "OCR" | "MANUAL",
  confidence: number
): QuickAddEntry {
  return {
    lineId: lineCounter++,
    nickname,
    value,
    raw,
    rawText: `${lastNickname ?? "??"} | ${line}`,
    status: "OK",
    confidence,
    sourceType,
  };
}

// =====================================
// 🔥 HELPERS
// =====================================

function normalizeLine(line: string): string {
  let out = line;

  // fix split numbers
  out = out.replace(/(\d{2,})\s+(\d{2,})/g, "$1$2");

  // fix K format
  out = out.replace(/(\d+)\s*K/gi, (_, n) => `${n}000`);

  // remove weird chars
  out = out.replace(/[^\p{L}\p{N}\s]/gu, " ");

  return out.trim();
}

function extractValue(line: string): number | null {
  const matches = line.match(/\d{3,}/g);
  if (!matches) return null;

  const values = matches
    .map(n => parseInt(n, 10))
    .filter(n => !isNaN(n));

  if (!values.length) return null;

  const valid = values.filter(v => v <= 200000);

  if (valid.length) return Math.max(...valid);

  return null;
}

function looksLikeDonations(line: string): boolean {
  return /donat|ionat|dona|tion/i.test(line);
}

function isNickname(line: string): boolean {
  const lower = line.toLowerCase();

  if (
    looksLikeDonations(line) ||
    lower.includes("ranking") ||
    lower.includes("total")
  ) return false;

  if (line.length < 3) return false;
  if (!/[a-z]/i.test(line)) return false;

  return true;
}

function isValidNickname(nick: string): boolean {
  if (!nick) return false;
  if (nick.length < 3) return false;
  if (/^\d+$/.test(nick)) return false;
  if (nick.length > 20) return false;

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

  // remove leading junk
  cleaned = cleaned.replace(/^[^a-zA-Z]+/, "");

  // remove rank prefixes like "R ", "S 4 "
  cleaned = cleaned.replace(/^[A-Z]\s*\d*\s+/i, "");

  // remove weird chars
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

    if (!map.has(key) || map.get(key)!.value < e.value) {
      map.set(key, e);
    }
  }

  return Array.from(map.values());
}