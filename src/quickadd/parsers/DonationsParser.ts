import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

export function parseDonations(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  let lastNickname: string | null = null;

  for (let rawLine of lines) {
    const line = rawLine.trim();

    // 🧠 nickname
    if (isNickname(line)) {
      lastNickname = line;
      continue;
    }

    // 💰 donations
    if (/donations/i.test(line)) {
      const value = extractValue(line);

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

      lastNickname = null;
    }
  }

  return entries;
}

// =========================
// helpers
// =========================

function isNickname(line: string): boolean {
  return (
    line.length >= 3 &&
    /[a-z]/i.test(line) &&
    !/donations/i.test(line)
  );
}

function extractValue(line: string): number | null {
  const match = line.match(/donations[:\s]*([\d,]+)/i);
  if (!match) return null;

  const value = parseInt(match[1].replace(/,/g, ""), 10);
  return isNaN(value) ? null : value;
}

// 🔥 FINAL CLEANUP
function normalizeNickname(name: string): string {
  return name
    .replace(/^[a-z]\s*/i, "")
    .replace(/^\d+\s*/, "")
    .replace(/^[a-z]\d+\s*/i, "")
    .replace(/^[a-z]\s+/i, "")
    .replace(/[<>]/g, "")
    .replace(/\s+[a-z]$/i, "")
    .replace(/[^\w\d_]/g, "")
    .trim();
}