import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

export function parseDonations(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  let lastNickname: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = cleanLine(rawLine);

    // =========================
    // 🧠 1. DETECT NICKNAME
    // =========================
    if (isNickname(line)) {
      lastNickname = line;
      continue;
    }

    // =========================
    // 💰 2. DONATIONS LINE
    // =========================
    if (/donations/i.test(line)) {
      const value = extractValue(line);

      let nickname = lastNickname;
      let status: QuickAddEntry["status"] = "OK";

      if (!nickname || nickname.length < 3) {
        nickname = "UNKNOWN";
        status = "UNREADABLE";
      }

      if (!value || value < 1000) {
        status = "UNREADABLE";
      }

      entries.push({
        lineId: lineCounter++,
        nickname,
        value: value ?? 0,
        raw: rawLine,
        rawText: `${lastNickname ?? "??"} | ${line}`,
        status,
        confidence: status === "OK" ? 1 : 0.4,
        sourceType: "OCR",
      });

      // 🔥 KLUCZOWE — reset po użyciu
      lastNickname = null;
    }
  }

  return dedupe(entries);
}

// =====================================
// 🧹 CLEAN OCR LINE
// =====================================
function cleanLine(line: string): string {
  return line
    .replace(/[ÔÇś@%]/g, "")       // śmieci OCR
    .replace(/^\d+\s*/, "")        // prefix typu "4 "
    .replace(/\s+/g, " ")
    .trim();
}

// =====================================
// 🧠 NICKNAME DETECTION
// =====================================
function isNickname(line: string): boolean {
  if (line.length < 3) return false;

  if (/donations/i.test(line)) return false;

  // musi zawierać litery
  if (!/[a-z]/i.test(line)) return false;

  // nie może być samymi symbolami
  if (/^[^a-z0-9]+$/i.test(line)) return false;

  return true;
}

// =====================================
// 💰 VALUE EXTRACTION
// =====================================
function extractValue(line: string): number | null {
  const match = line.match(/donations[:\s]*([\d,]+)/i);
  if (!match) return null;

  const value = parseInt(match[1].replace(/,/g, ""), 10);

  return isNaN(value) ? null : value;
}

// =====================================
// 🧹 DEDUPE (ANTI-SPAM)
// =====================================
function dedupe(entries: QuickAddEntry[]): QuickAddEntry[] {
  const seen = new Set<string>();

  return entries.filter((e) => {
    const key = `${e.nickname}-${e.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}