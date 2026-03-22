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

    // 🔥 NORMAL donations
    if (isDonationsLine(line)) {
      const value = extractValueSafe(line);
      if (!value) continue;

      const nickData = findNicknameAboveSmart(cleanedLines, i);
      if (!nickData) continue;

      entries.push(buildEntry(lineId++, nickData, value, line, 1));
      continue;
    }

    // 🔥 FALLBACK (BEZ "Donations")
    if (/\d{4,6}/.test(line)) {
      const value = extractValueSafe(line);
      if (!value) continue;

      const nickData = findNicknameAboveSmart(cleanedLines, i);
      if (!nickData) continue;

      entries.push(buildEntry(lineId++, nickData, value, line, 0.6));
      continue;
    }

    // 🔥 INLINE
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
// 🔥 ENTRY BUILDER (FIXED CONFIDENCE)
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
// 🔥 DONATIONS DETECTION (FUZZY)
// =====================================
function isDonationsLine(line: string): boolean {
  const l = line.toLowerCase();

  return (
    /donations/.test(l) ||
    /donat/.test(l) ||
    /d0nat/.test(l) ||
    /donat1/.test(l) ||
    /e.?st.?ons/.test(l)
  );
}

function isSystemLine(line: string): boolean {
  return /at least|required|rewards|ranking/i.test(line);
}

// =====================================
// 🔥 VALUE EXTRACTION (SMART)
// =====================================
function extractValueSafe(line: string): number | null {
  let raw = line.toLowerCase();

  raw = raw.replace(/([0-9][0-9,.\s]*)[a-z]+\d*$/i, "$1");
  raw = raw.replace(/(\d{2,})\s+(\d{3})/g, "$1$2");

  const kMatch = raw.match(/(\d+(?:\.\d+)?)\s*k/);
  if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000);

  const matches = raw.match(/\d{2,6}(?:,\d{3})*/g);
  if (!matches) return null;

  return matches
    .map((v) => parseInt(v.replace(/,/g, ""), 10))
    .sort((a, b) => b - a)[0];
}

// =====================================
// 🔥 SMART LOOKBACK (8 LINES)
// =====================================
function findNicknameAboveSmart(lines: string[], index: number) {
  for (let i = 1; i <= 8; i++) {
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

// =====================================
// 🔥 NICK CLEAN (SAFE)
// =====================================
function normalizeNickname(name: string): string {
  return name
    .trim()
    .replace(/^[^a-zA-Z0-9]+/, "")
    .replace(/[^\p{L}\p{N}_]/gu, "");
}

// =====================================
// 🔥 INLINE PARSER
// =====================================
function parseInlineStrong(line: string) {
  const match = line.match(/^([^\d]{3,}?)\s*(\d{4,6})$/);
  if (!match) return null;

  return {
    nick: normalizeNickname(match[1]),
    value: parseInt(match[2], 10),
  };
}

// =====================================
// 🔥 HELPERS
// =====================================
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

// =====================================
// 🔥 LINE DEDUPE
// =====================================
function dedupeLines(lines: string[]): string[] {
  const seen = new Set<string>();
  return lines.filter((l) => {
    const key = l.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// =====================================
// 🔥 ENTRY DEDUPE (FIXED TS + SMART)
// =====================================
function dedupeEntries(entries: QuickAddEntry[]) {
  const map = new Map<string, QuickAddEntry>();

  for (const e of entries) {
    const key = e.nickname.toLowerCase();
    const existing = map.get(key);

    const eConf = e.confidence ?? 0;

    if (!existing) {
      map.set(key, {
        ...e,
        confidence: eConf,
      });
      continue;
    }

    const existingConf = existing.confidence ?? 0;

    // 🔥 jeśli ta sama wartość → boost confidence
    if (existing.value === e.value) {
      existing.confidence = existingConf + 0.2;
      continue;
    }

    // 🔥 wybór lepszego wpisu
    if (
      e.value > existing.value ||
      eConf > existingConf
    ) {
      map.set(key, {
        ...e,
        confidence: eConf,
      });
    }
  }

  return Array.from(map.values());
}