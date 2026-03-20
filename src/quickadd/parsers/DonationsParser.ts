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
// 🔥 MAIN PARSER (V3 - FIXED)
// =====================================
export function parseDonations(lines: string[]): QuickAddEntry[] {
  console.log("=================================");
  console.log("🧠 DonationsParser START (V3)");
  console.log("=================================");

  const entries: QuickAddEntry[] = [];
  let lastNickname: string | null = null;

  const cleanedLines = dedupeLines(lines);

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
    // 💰 DONATIONS (PRIORITY!)
    // =========================
    if (looksLikeDonations(line)) {
      const value = extractValue(line);

      console.log("   💰 donations detected, value:", value);

      if (!value || value < 1000 || value > 200000) {
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

      continue;
    }

    // =========================
    // ✍️ MANUAL (SAFE)
    // =========================
    const manualMatch = line.match(/^(.+?)\s+(\d{3,})$/);
    if (manualMatch) {
      const rawNick = manualMatch[1];

      // 🔥 BLOCK "Donations"
      if (looksLikeDonations(rawNick)) {
        console.log("   ❌ manual rejected (donation keyword)");
        continue;
      }

      const nickname = normalizeNickname(rawNick);
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
    // 🔥 NUMBER ONLY FALLBACK
    // =========================
    const numberOnly = line.match(/(\d{4,})/);
    if (numberOnly) {
      const value = parseInt(numberOnly[1], 10);

      if (!value || value < 1000 || value > 200000) continue;

      const nickname = normalizeNickname(lastNickname || "");

      if (!nickname || nickname.length < 2) continue;

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
    // 🧠 NICKNAME
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

  return dedupeEntries(entries);
}

// =====================================
// 🔥 HELPERS
// =====================================

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

  // 🔥 FIX: realistic filter
  const valid = values.filter(v => v <= 200000);

  if (valid.length > 0) {
    return Math.max(...valid);
  }

  const max = Math.max(...values);
  if (max > 1000000) return null;

  return max;
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
    lower.includes("total")
  ) return false;

  if (line.length < 3) return false;
  if (!/[a-z]/i.test(line)) return false;

  const digitCount = (line.match(/\d/g) || []).length;
  if (digitCount > 3) return false;

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
  cleaned = cleaned.replace(/^[a-z]\d+\s+/i, "");
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