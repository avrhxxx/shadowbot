// src/quickadd/parsers/DonationsParser.ts
import { QuickAddEntry } from "../types/QuickAddEntry";
import { parseValue } from "../utils/parseValue";
import { askLlama } from "../services/LlamaService"; // 🤖 AI

const DEBUG = true;
const DEBUG_AI = true;

function log(...args: any[]) {
  if (DEBUG) console.log("[DonationsParser]", ...args);
}

function logAI(...args: any[]) {
  if (DEBUG_AI) console.log("[DonationsParser][AI]", ...args);
}

// 🔥 UWAGA: parser async (bo AI)
export async function parseDonations(lines: string[]): Promise<QuickAddEntry[]> {
  let lineId = 1;
  const entries: QuickAddEntry[] = [];
  const cleanedLines = dedupeLines(lines);

  log("START PARSE | lines:", cleanedLines.length);

  for (let i = 0; i < cleanedLines.length; i++) {
    let line = cleanedLines[i].trim();
    if (!line) continue;

    line = fixSplitNumbers(line);

    if (isTimestamp(line) || isGarbage(line) || isSystemLine(line)) {
      continue;
    }

    if (/^,\d{3}$/.test(line)) {
      continue;
    }

    // =============================
    // 🎯 PRIMARY
    // =============================
    if (isDonationsLine(line)) {
      const value = extractValueSafe(line);

      if (!isValidValue(value)) continue;

      const nickData = findNicknameAboveSmart(cleanedLines, i);
      if (!nickData) continue;

      log("✅ PRIMARY:", nickData.clean, value);

      entries.push(buildEntry(lineId++, nickData, value!, line, 1));
      continue;
    }

    // =============================
    // 🔥 FALLBACK
    // =============================
    if (/donat/i.test(line) && /\d{4,6}/.test(line)) {
      const value = extractValueSafe(line);

      if (!isValidValue(value)) continue;

      const nickData = findNicknameAboveSmart(cleanedLines, i);
      if (!nickData) continue;

      log("✅ FALLBACK:", nickData.clean, value);

      entries.push(buildEntry(lineId++, nickData, value!, line, 0.7));
      continue;
    }

    // =============================
    // INLINE
    // =============================
    const inline = parseInlineStrong(line);
    if (inline && isValidValue(inline.value)) {
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
      continue;
    }

    // =============================
    // 🤖 AI FALLBACK (OSTATNIA SZANSA)
    // =============================
    if (/[a-z]/i.test(line) && /\d{3,}/.test(line)) {
      logAI("TRY:", line);

      const ai = await tryParseWithAI(line);

      if (!ai) {
        logAI("❌ AI NULL");
        continue;
      }

      if (!isValidValue(ai.value)) {
        logAI("❌ AI INVALID VALUE:", ai.value);
        continue;
      }

      logAI("✅ AI HIT:", ai.nickname, ai.value);

      entries.push({
        lineId: lineId++,
        nickname: ai.nickname,
        value: ai.value,
        raw: line,
        rawText: line,
        status: "OK",
        confidence: ai.confidence ?? 0.5,
        sourceType: "AI",
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
function extractValueSafe(line: string): number | null {
  if (!line) return null;

  const parsed = parseValue(line);
  if (parsed) return parsed;

  const match = line.match(/\d{2,3}(?:,\d{3})+/);
  if (match) {
    const num = parseInt(match[0].replace(/,/g, ""), 10);
    if (num >= 1000 && num <= 300000) return num;
  }

  return null;
}

// =====================================
function isValidValue(value: number | null): value is number {
  if (!value) return false;
  if (value < 5000) return false;
  if (value > 300000) return false;
  return true;
}

// =====================================
function isDonationsLine(line: string): boolean {
  return /donat|d0nat|donat1|e.?st.?ons/i.test(line);
}

function isSystemLine(line: string): boolean {
  return /at least|required|rewards|ranking/i.test(line);
}

// =====================================
function findNicknameAboveSmart(lines: string[], index: number) {
  for (let i = 1; i <= 4; i++) {
    const line = lines[index - i];
    if (!line) continue;

    if (isDonationsLine(line) || isSystemLine(line)) continue;
    if (!isNickname(line)) continue;

    const clean = normalizeNickname(line);
    if (!isValidNickname(clean)) continue;

    return {
      raw: line,
      clean,
      confidence: 1 - i * 0.15,
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

// =====================================
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

// =====================================
// 🤖 AI FALLBACK
// =====================================
async function tryParseWithAI(line: string) {
  try {
    const prompt = `
Extract nickname and donation value from OCR.

Return ONLY JSON:
{"nickname":"string","value":number}

Text:
${line}
`;

    logAI("PROMPT:", prompt);

    const res = await askLlama(prompt);

    logAI("RAW:", res);

    const jsonMatch = res.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logAI("❌ NO JSON");
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    logAI("PARSED:", parsed);

    if (!parsed.nickname || typeof parsed.value !== "number") {
      logAI("❌ INVALID STRUCTURE");
      return null;
    }

    return {
      nickname: parsed.nickname.trim(),
      value: parsed.value,
      confidence: 0.5,
    };
  } catch (err) {
    console.warn("⚠️ AI PARSE FAILED:", err);
    return null;
  }
}