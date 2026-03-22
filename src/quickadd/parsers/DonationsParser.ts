// src/quickadd/parsers/DonationsParser.ts
import { QuickAddEntry } from "../types/QuickAddEntry";

const DEBUG = true;

function log(...args: any[]) {
  if (DEBUG) console.log("[DonationsParser]", ...args);
}

export function parseDonations(lines: string[]): QuickAddEntry[] {
  let lineId = 1;
  const entries: QuickAddEntry[] = [];
  const cleanedLines = dedupeLines(lines);

  log("START PARSE | lines:", cleanedLines.length);

  for (let i = 0; i < cleanedLines.length; i++) {
    let line = cleanedLines[i].trim();
    if (!line) continue;

    line = fixSplitNumbers(line);

    if (isTimestamp(line) || isGarbage(line) || isSystemLine(line)) {
      log("SKIP SYSTEM/GARBAGE:", line);
      continue;
    }

    if (/^,\d{3}$/.test(line)) {
      log("SKIP SPLIT NUMBER:", line);
      continue;
    }

    // =============================
    // 🎯 PRIMARY
    // =============================
    if (isDonationsLine(line)) {
      log("PRIMARY HIT:", line);

      const value = extractValueFromBlock(cleanedLines, i);
      if (!isValidValue(value)) {
        log("❌ INVALID VALUE (PRIMARY):", line, value);
        continue;
      }

      const nickData = findNicknameAboveSmart(cleanedLines, i);
      if (!nickData) {
        log("❌ NO NICK (PRIMARY):", line);
        continue;
      }

      log("✅ PRIMARY ENTRY:", nickData.clean, value);

      entries.push(buildEntry(lineId++, nickData, value!, line, 1));
      continue;
    }

    // =============================
    // 🔥 FALLBACK
    // =============================
    if (
      /\d{4,6}/.test(line) &&
      !/^\d+$/.test(line) &&
      /[a-z]/i.test(line)
    ) {
      log("FALLBACK HIT:", line);

      const value = extractValueFromBlock(cleanedLines, i);
      if (!isValidValue(value)) {
        log("❌ INVALID VALUE (FALLBACK):", line, value);
        continue;
      }

      const nickData = findNicknameAboveSmart(cleanedLines, i);
      if (!nickData) {
        log("❌ NO NICK (FALLBACK):", line);
        continue;
      }

      log("✅ FALLBACK ENTRY:", nickData.clean, value);

      entries.push(buildEntry(lineId++, nickData, value!, line, 0.6));
      continue;
    }

    // =============================
    // INLINE
    // =============================
    const inline = parseInlineStrong(line);
    if (inline && isValidValue(inline.value)) {
      log("INLINE HIT:", inline.nick, inline.value);

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

  log("END PARSE | entries:", entries.length);

  return dedupeEntries(entries);
}

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
function extractValueFromBlock(lines: string[], index: number): number | null {
  let base = lines[index];
  const next = lines[index + 1];

  if (next && /^,\d{3}$/.test(next.trim())) {
    base += next.trim();
    log("MERGED SPLIT NUMBER:", base);
  }

  const value = extractValueSafe(base);

  log("VALUE EXTRACT:", {
    base,
    value,
  });

  return value;
}

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
      if (x >= 20000 && x <= 100000) return 100;
      if (x >= 5000 && x <= 200000) return 50;
      return 0;
    };
    return score(b) - score(a) || b - a;
  });

  return parsed[0];
}

// =====================================
function isValidValue(value: number | null): value is number {
  if (!value) return false;
  if (value < 1000) return false;
  if (value > 1000000) return false;
  return true;
}

// =====================================
function isDonationsLine(line: string): boolean {
  return /donat|d0nat|donat1|e.?st.?ons/i.test(line);
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

// =====================================
function normalizeNickname(name: string): string {
  return name
    .replace(/donations?.*/i, "")
    .replace(/[|[\]{}()'"`,._:;]/g, " ")
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
  if (line.length < 3) return false;
  if (!/[a-zA-Z]/.test(line)) return false;
  if (/donations/i.test(line)) return false;
  return true;
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