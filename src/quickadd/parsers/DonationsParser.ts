// src/quickadd/parsers/DonationsParser.ts

import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

export function parseDonations(lines: string[]): QuickAddEntry[] {
  console.log("=================================");
  console.log("🧠 DonationsParser START (V8 GOD MODE)");
  console.log("=================================");

  const entries: QuickAddEntry[] = [];
  const cleanedLines = dedupeLines(lines);

  for (let i = 0; i < cleanedLines.length; i++) {
    let line = cleanedLines[i].trim();
    if (!line) continue;

    line = fixSplitNumbers(line);

    console.log(`🔎 [${i}] "${line}"`);

    if (isGarbage(line)) continue;

    if (looksLikeDonations(line) || hasBigNumber(line)) {
      const value = extractValue(line);

      console.log("   💰 value detected:", value);

      if (!value) continue;

      // 🔥 1. próbuj znaleźć nick wyżej
      let nickData = findNicknameAbove(cleanedLines, i);

      // 🔥 2. fallback: nick w tej samej linii
      if (!nickData) {
        const inlineNick = extractInlineNickname(line);

        if (inlineNick) {
          nickData = {
            raw: line,
            clean: inlineNick,
            confidence: 0.6,
          };
        }
      }

      if (!nickData) {
        console.log("   ❌ no nickname found");
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

  return dedupeEntries(entries);
}

// ================= 🔥 LOOKBACK =================

function findNicknameAbove(
  lines: string[],
  index: number
): { raw: string; clean: string; confidence: number } | null {
  const MAX_LOOKBACK = 5; // 🔥 było 3

  for (let i = 1; i <= MAX_LOOKBACK; i++) {
    const line = lines[index - i];
    if (!line) continue;

    if (!isNickname(line)) continue;

    const clean = normalizeNickname(line);
    if (!isValidNickname(clean)) continue;

    const confidence = 1 - (i - 1) * 0.15;

    return { raw: line, clean, confidence };
  }

  return null;
}

// ================= 🔥 HELPERS =================

function extractInlineNickname(line: string): string | null {
  const match = line.match(/^([a-z0-9\-_]{3,})/i);
  return match ? match[1] : null;
}

function hasBigNumber(line: string): boolean {
  return /\d{4,}/.test(line);
}

function extractValue(line: string): number | null {
  let raw = line.toLowerCase();

  const kMatch = raw.match(/(\d{2,})\s*k/);
  if (kMatch) return parseInt(kMatch[1], 10) * 1000;

  raw = raw.replace(/[^\d\s]/g, "");
  raw = fixSplitNumbers(raw);

  const matches = raw.match(/\d{4,6}/g);
  if (!matches) return null;

  const values = matches.map(Number).filter(n => n >= 1000 && n <= 200000);

  return values.length ? Math.max(...values) : null;
}

function fixSplitNumbers(str: string): string {
  return str.replace(/(\d{2,})\s+(\d{2,})/g, "$1$2");
}

function looksLikeDonations(line: string): boolean {
  return /donat|ionat|dona|tion/i.test(line);
}

function isNickname(line: string): boolean {
  if (line.length < 3) return false;
  if (!/[a-z]/i.test(line)) return false;

  // 🔥 pozwalamy na WG1-14 itd
  if (/^[a-z0-9\-_]+$/i.test(line)) return true;

  const digitCount = (line.match(/\d/g) || []).length;
  if (digitCount > 5) return false;

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
    .replace(/^[^a-zA-Z0-9]+/, "")
    .replace(/[^\p{L}\p{N}_\-]/gu, "")
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