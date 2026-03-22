// src/quickadd/parsers/DonationsParser.ts
import { QuickAddEntry } from "../types/QuickAddEntry";

export function parseDonations(lines: string[]): QuickAddEntry[] {
  let lineId = 1;
  const entries: QuickAddEntry[] = [];
  const cleanedLines = dedupeLines(lines);

  for (let i = 0; i < cleanedLines.length; i++) {
    let line = cleanedLines[i].trim();
    if (!line) continue;

    line = fixSplitNumbers(line);

    if (isTimestamp(line) || isGarbage(line) || isSystemLine(line)) {
      continue;
    }

    // =============================
    // 🎯 PRIMARY (Donations line)
    // =============================
    if (isDonationsLine(line)) {
      const value = extractValueFromBlock(cleanedLines, i);
      if (!value) continue;

      const nickData = findNicknameAboveSmart(cleanedLines, i);
      if (!nickData) continue;

      entries.push(buildEntry(lineId++, nickData, value, line, 1));
      continue;
    }

    // =============================
    // 🔥 SMART FALLBACK (ograniczony)
    // =============================
    if (
      /\d{4,6}/.test(line) &&
      !/^\d+$/.test(line) &&
      /[a-z]/i.test(line)
    ) {
      const value = extractValueFromBlock(cleanedLines, i);
      if (!value) continue;

      const nickData = findNicknameAboveSmart(cleanedLines, i);
      if (!nickData) continue;

      entries.push(buildEntry(lineId++, nickData, value, line, 0.6));
      continue;
    }

    // =============================
    // INLINE (rzadkie)
    // =============================
    const inline = parseInlineStrong(line);
    if (inline) {
      entries.push({
        lineId: lineId++,
        nickname: inline.nick,
        value: inline.value,
        raw: line,
        rawText: line,
        status: "OK",
        confidence: 0.75,
        sourceType: "OCR",
      });
    }
  }

  return dedupeEntries(entries);
}

// =====================================
// ENTRY BUILDER
// =====================================
function buildEntry(
  id: number,
  nickData: any,
  value: number,
  line: string,
  conf: number
): QuickAddEntry {
  return {
    lineId: id,
    nickname: nickData.clean,
    value,
    raw: nickData.raw,
    rawText: `${nickData.raw} | ${line}`,
    status: "OK",
    confidence: conf ?? 0,
    sourceType: "OCR",
  };
}

// =====================================
// 🔥 VALUE BLOCK FIX (NOWE)
// =====================================
function extractValueFromBlock(lines: string[], index: number): number | null {
  let buffer = lines[index];

  for (let i = 1; i <= 2; i++) {
    const next = lines[index + i];
    if (!next) continue;

    if (/^,\d{3}$/.test(next.trim())) {
      buffer += next.trim();
    }
  }

  return extractValueSafe(buffer);
}

// =====================================
// VALUE EXTRACTION
// =====================================
function extractValueSafe(line: string): number | null {
  let raw = line.toLowerCase();

  raw = raw.replace(/([0-9][0-9,.\s]*)[a-z]+\d*$/i, "$1");
  raw = raw.replace(/(\d{2,})\s+(\d{3})/g, "$1$2");

  const kMatch = raw.match(/(\d+(?:\.\d+)?)\s*k/);
  if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000);

  const matches = raw.match(/\d{2,6}(?:,\d{3})*/g);
  if (!matches) return null;

  const parsed = matches
    .map((v) => parseInt(v.replace(/,/g, ""), 10))
    .filter((v) => v < 1_000_000);

  if (!parsed.length) return null;

  parsed.sort((a, b) => {
    const score = (x: number) => {
      if (x > 10000 && x < 150000) return 100;
      if (x > 1000 && x < 300000) return 50;
      return 0;
    };
    return score(b) - score(a) || b - a;
  });

  return parsed[0];
}

// =====================================
// HELPERS
// =====================================
function isDonationsLine(line: string): boolean {
  const l = line.toLowerCase();
  return /donat|d0nat|donat1|e.?st.?ons/.test(l);
}

function isSystemLine(line: string): boolean {
  return /at least|required|rewards|ranking/i.test(line);
}

function findNicknameAboveSmart(lines: string[], index: number) {
  for (let i = 1; i <= 5; i++) {
    const line = lines[index - i];
    if (!line) continue;

    if (isDonationsLine(line) || isSystemLine(line)) continue;
    if (!isNickname(line)) continue;

    const clean = normalizeNickname(line);
    if (!isValidNickname(clean)) continue;

    return {
      raw: line,
      clean,
      confidence: 1 - i * 0.1,
    };
  }
  return null;
}

// 🔥 FIXED NORMALIZATION
function normalizeNickname(name: string): string {
  return name
    .replace(/donations?.*/i, "")
    .replace(/[|[\]{}()'"`,._]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => /[a-zA-Z]/.test(w))
    .join("")
    .slice(0, 20);
}

function parseInlineStrong(line: string) {
  const match = line.match(/^([^\d]{3,}?)\s*(\d{4,6})$/);
  if (!match) return null;

  return {
    nick: normalizeNickname(match[1]),
    value: parseInt(match[2], 10),
  };
}

function isTimestamp(line: string): boolean {
  return /\d{4}-\d{2}|\d{2}:\d{2}/.test(line);
}

function fixSplitNumbers(str: string): string {
  return str.replace(/(\d{2,})\s+(\d{3})/g, "$1$2");
}

function isNickname(line: string): boolean {
  return line.length >= 3 && /[a-zA-Z]/.test(line);
}

function isValidNickname(nick: string): boolean {
  return nick.length >= 3;
}

function isGarbage(line: string): boolean {
  return line.length < 2;
}

function dedupeLines(lines: string[]): string[] {
  const seen = new Set<string>();
  return lines.filter((l) => {
    const key = l.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeEntries(entries: QuickAddEntry[]) {
  const map = new Map<string, QuickAddEntry>();

  for (const e of entries) {
    const key = e.nickname.toLowerCase();
    const existing = map.get(key);

    const eConf = e.confidence ?? 0;

    if (!existing) {
      map.set(key, { ...e, confidence: eConf });
      continue;
    }

    const existingConf = existing.confidence ?? 0;

    if (existing.value === e.value) {
      existing.confidence = existingConf + 0.2;
      continue;
    }

    if (e.value > existing.value || eConf > existingConf) {
      map.set(key, { ...e, confidence: eConf });
    }
  }

  return Array.from(map.values());
}