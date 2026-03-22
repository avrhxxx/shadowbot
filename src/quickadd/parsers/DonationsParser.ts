// src/quickadd/parsers/DonationsParser.ts

import { QuickAddEntry } from "../types/QuickAddEntry";

export function parseDonations(lines: string[]): QuickAddEntry[] {
  let lineId = 1;
  const entries: QuickAddEntry[] = [];

  // 🔥 MULTI OCR PREP
  const cleanedLines = mergeSplitValueLines(dedupeLines(lines));

  for (let i = 0; i < cleanedLines.length; i++) {
    let line = cleanedLines[i].trim();
    if (!line) continue;

    line = fixSplitNumbers(line);

    if (isTimestamp(line) || isGarbage(line) || isSystemLine(line)) {
      continue;
    }

    // =====================================
    // 🔥 NORMAL donations
    // =====================================
    if (isDonationsLine(line)) {
      const value = extractValueSafe(line);
      if (!value) continue;

      const nickData = findNicknameAboveSmart(cleanedLines, i);
      if (!nickData) continue;

      entries.push(buildEntry(lineId++, nickData, value, line, 1));
      continue;
    }

    // =====================================
    // 🔥 FALLBACK
    // =====================================
    if (
      /\d{4,6}/.test(line) &&
      !isTimestamp(line) &&
      !isSystemLine(line) &&
      !isDonationsLine(line)
    ) {
      const value = extractValueSafe(line);
      if (!value) continue;

      const nickData = findNicknameAboveSmart(cleanedLines, i);
      if (!nickData) continue;

      entries.push(buildEntry(lineId++, nickData, value, line, 0.6));
      continue;
    }

    // =====================================
    // 🔥 INLINE
    // =====================================
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
// 🔥 MERGE SPLIT VALUES (multi OCR fix)
// =====================================
function mergeSplitValueLines(lines: string[]): string[] {
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const current = lines[i];
    const next = lines[i + 1];

    if (
      current?.startsWith(",") &&
      next?.startsWith(",") &&
      /^\d{2,3}$/.test(current.replace(",", "")) &&
      /^\d{2,3}$/.test(next.replace(",", ""))
    ) {
      const merged = current.replace(",", "") + next.replace(",", "");
      result.push(merged);
      i++;
      continue;
    }

    result.push(current);
  }

  return result;
}

// =====================================
// BUILD ENTRY
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
    confidence: conf,
    sourceType: "OCR",
  };
}

// =====================================
// DONATIONS DETECT
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
  return /at least|required|rewards|ranking|mail|donations\.$/i.test(line);
}

// =====================================
// 🔥 VALUE EXTRACTION (ULTRA)
// =====================================
function extractValueSafe(line: string): number | null {
  if (!line) return null;

  let raw = line.toLowerCase();

  // 🔥 fix split numbers
  raw = raw.replace(/(\d)\s+(\d)/g, "$1$2");

  // 🔥 fix broken commas (37,1 54 → 37154)
  raw = raw.replace(/(\d),(\d)\s+(\d{2})/g, "$1$2$3");

  // 🔥 remove garbage suffix
  raw = raw.replace(/([0-9][0-9,.\s]*)[a-z]+\d*$/i, "$1");

  // 🔥 K support
  const kMatch = raw.match(/(\d+(?:\.\d+)?)\s*k/i);
  if (kMatch) {
    return Math.round(parseFloat(kMatch[1]) * 1000);
  }

  const numbers = raw.match(/\d{2,}/g);
  if (!numbers) return null;

  const parsed = numbers.map(n => parseInt(n.replace(/,/g, ""), 10));

  return parsed.sort((a, b) => b - a)[0];
}

// =====================================
// 🔥 LOOKBACK SMART
// =====================================
function findNicknameAboveSmart(lines: string[], index: number) {
  for (let i = 1; i <= 8; i++) {
    const line = lines[index - i];
    if (!line) continue;

    if (isDonationsLine(line) || isSystemLine(line)) continue;
    if (/\d{4,}/.test(line)) continue;
    if (!isNickname(line)) continue;

    const clean = normalizeNickname(line);
    if (!isValidNickname(clean)) continue;

    const confidenceBoost =
      /[A-Z]/.test(line) && /[a-z]/.test(line) ? 0.1 : 0;

    return {
      raw: line,
      clean,
      confidence: Math.max(0.5, 1 - i * 0.1 + confidenceBoost),
    };
  }

  return null;
}

// =====================================
// NORMALIZE NICK
// =====================================
function normalizeNickname(name: string): string {
  return name
    .trim()
    .replace(/^[^a-zA-Z0-9]+/, "")
    .replace(/[^\p{L}\p{N}_]/gu, "");
}

// =====================================
// INLINE PARSE
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
// HELPERS
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
  if (!line) return true;

  const l = line.trim();

  return (
    l.length < 2 ||
    /^[,.\-]+$/.test(l)
  );
}

// =====================================
// DEDUPE
// =====================================
function dedupeLines(lines: string[]): string[] {
  const seen = new Set<string>();
  return lines.filter(l => {
    const key = l.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// 🔥 MULTI OCR READY MERGE
function dedupeEntries(entries: QuickAddEntry[]) {
  const map = new Map<string, QuickAddEntry>();

  for (const e of entries) {
    const key = e.nickname.toLowerCase();
    const existing = map.get(key);

    if (!existing) {
      map.set(key, e);
      continue;
    }

    // 🔥 jeśli ta sama wartość → boost confidence
    if (existing.value === e.value) {
      existing.confidence += 0.2;
      continue;
    }

    // 🔥 wybierz lepszy wpis
    if (
      e.value > existing.value ||
      e.confidence > existing.confidence
    ) {
      map.set(key, e);
    }
  }

  return Array.from(map.values());
}