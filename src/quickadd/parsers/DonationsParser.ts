import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

export function parseDonations(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  let lastNickname: string | null = null;

  for (let rawLine of lines) {
    const line = rawLine.trim();

    // =========================
    // 🧠 DETECT NICKNAME
    // =========================
    if (isNickname(line)) {
      lastNickname = line;
      continue;
    }

    // =========================
    // 💰 DONATIONS LINE
    // =========================
    if (/donations/i.test(line)) {
      const value = extractValue(line);

      // 🔥 odrzucamy śmieci typu "43"
      if (!value || value < 1000) continue;

      const nickname = normalizeNickname(lastNickname || "UNKNOWN");

      entries.push({
        lineId: lineCounter++,
        nickname,
        value,
        raw: rawLine,
        rawText: `${lastNickname ?? "??"} | ${line}`,
        status: nickname === "UNKNOWN" ? "UNREADABLE" : "OK",
        confidence: nickname === "UNKNOWN" ? 0.4 : 1,
        sourceType: "OCR",
      });

      // 🔥 reset state
      lastNickname = null;
    }
  }

  return entries;
}

// =========================
// 🧠 NICKNAME CHECK
// =========================
function isNickname(line: string): boolean {
  return (
    line.length >= 3 &&
    /[a-z]/i.test(line) &&
    !/donations/i.test(line)
  );
}

// =========================
// 💰 VALUE EXTRACT
// =========================
function extractValue(line: string): number | null {
  const match = line.match(/donations[:\s]*([\d,]+)/i);
  if (!match) return null;

  const value = parseInt(match[1].replace(/,/g, ""), 10);
  return isNaN(value) ? null : value;
}

// =========================
// 🔥 FINAL NICKNAME CLEANER
// =========================
function normalizeNickname(name: string): string {
  let cleaned = name.trim();

  // 🔥 usuń prefix typu "g ", "R "
  cleaned = cleaned.replace(/^[a-z]{1}\s+/i, "");

  // 🔥 usuń prefix typu "a4 ", "S 4 "
  cleaned = cleaned.replace(/^[a-z]\d+\s+/i, "");
  cleaned = cleaned.replace(/^\d+\s+/i, "");

  // 🔥 usuń śmieci typu "<"
  cleaned = cleaned.replace(/[<>]/g, "");

  // 🔥 usuń końcówki typu " g", " i"
  cleaned = cleaned.replace(/\s+[a-z]$/i, "");

  // 🔥 usuń wszystko poza nickiem
  cleaned = cleaned.replace(/[^\w\d_]/g, "");

  return cleaned.trim();
}