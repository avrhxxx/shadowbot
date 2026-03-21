// src/quickadd/parsers/DonationsParser.ts

import { QuickAddEntry } from "../types/QuickAddEntry";

export function parseDonations(lines: string[]): QuickAddEntry[] {
  console.log("=================================");
  console.log("🧠 DonationsParser START (V12)");
  console.log("=================================");

  let lineId = 1;
  const entries: QuickAddEntry[] = [];
  const cleanedLines = dedupeLines(lines);

  for (let i = 0; i < cleanedLines.length; i++) {
    let line = cleanedLines[i].trim();
    if (!line) continue;

    line = fixSplitNumbers(line);

    console.log(`\n🔎 [${i}] "${line}"`);

    if (isTimestamp(line) || isGarbage(line)) {
      console.log("   ⛔ skipped");
      continue;
    }

    // =========================
    // 🔥 1. INLINE PARSE (KLUCZOWE)
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
        confidence: 1,
        sourceType: "OCR",
      });

      continue;
    }

    // =========================
    // 💰 2. NORMAL VALUE PARSE
    // =========================
    if (hasBigNumber(line)) {
      const value = extractValue(line);

      if (!value) continue;

      const nickData = findNicknameAboveSmart(cleanedLines, i);

      if (!nickData) {
        console.log("   ⚠️ orphan → creating UNKNOWN");

        entries.push({
          lineId: lineId++,
          nickname: `UNKNOWN_${lineId}`,
          value,
          raw: line,
          rawText: line,
          status: "ORPHAN",
          confidence: 0.3,
          sourceType: "OCR",
        });

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
    }
  }

  const finalEntries = dedupeEntries(entries);

  console.log("=================================");
  console.log("📊 FINAL ENTRIES:", finalEntries.length);
  console.log("=================================");

  return finalEntries;
}

//
// ================= INLINE PARSER =================
//

function parseInline(line: string): { nick: string; value: number } | null {
  const fixed = fixSplitNumbers(line);

  // np: "Elc;natlonSZ 33276 g"
  const match = fixed.match(/([^\d]{3,}?)\s*(\d{4,6})/);

  if (!match) return null;

  const rawNick = match[1];
  const value = parseInt(match[2], 10);

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

  for (let i = 1; i <= 6; i++) {
    const line = lines[index - i];
    if (!line) continue;

    // ❗ stop jeśli trafimy na inną wartość
    if (hasBigNumber(line)) {
      console.log("   ⛔ hit another value → STOP");
      break;
    }

    if (!isNickname(line)) continue;

    const clean = normalizeNickname(line);
    if (!isValidNickname(clean)) continue;

    const confidence = 1 - i * 0.15;

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

function hasBigNumber(line: string): boolean {
  return /\d{4,}/.test(line);
}

function extractValue(line: string): number | null {
  let raw = line.toLowerCase();

  raw = raw.replace(/(\d{2,})\s+(\d{3})/g, "$1$2");

  const kMatch = raw.match(/(\d+(?:\.\d+)?)\s*k/);
  if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000);

  raw = raw.replace(/[^\d\s]/g, "");

  const matches = raw.match(/\d{4,6}/g);
  if (!matches) return null;

  return Math.max(...matches.map(n => parseInt(n, 10)));
}

function fixSplitNumbers(str: string): string {
  return str.replace(/(\d{2,})\s+(\d{3})/g, "$1$2");
}

function isNickname(line: string): boolean {
  if (hasBigNumber(line)) return false;
  if (line.length < 3) return false;
  if (!/[a-zA-Z]/.test(line)) return false;
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

function normalizeNickname(name: string): string {
  return name
    .trim()
    .replace(/^[^a-zA-Z0-9]+/, "")
    .replace(/[^\p{L}\p{N}_]/gu, "")
    .replace(/g$/, "") // 🔥 usuwa OCR śmieci typu "katzg"
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