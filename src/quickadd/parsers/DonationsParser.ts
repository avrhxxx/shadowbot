import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

export function parseDonations(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  let lastNickname: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine;

    // =========================
    // 🆕 CASE: inline (Nick Donations: value)
    // =========================
    const inlineMatch = line.match(/^(.+?)\s+donations[:\s]*([\d,]+)/i);
    if (inlineMatch) {
      const nickname = inlineMatch[1];
      const value = parseInt(inlineMatch[2].replace(/,/g, ""), 10);

      if (value >= 1000) {
        entries.push({
          lineId: lineCounter++,
          nickname,
          value,
          raw: rawLine,
          rawText: line,
          status: "OK",
          confidence: 1,
          sourceType: "OCR",
        });
      }

      lastNickname = null;
      continue;
    }

    // =========================
    // 🧠 NICKNAME
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

      if (!value || value < 1000) {
        lastNickname = null;
        continue;
      }

      let nickname = lastNickname;
      let status: QuickAddEntry["status"] = "OK";

      if (!nickname) {
        nickname = "UNKNOWN";
        status = "UNREADABLE";
      }

      entries.push({
        lineId: lineCounter++,
        nickname,
        value,
        raw: rawLine,
        rawText: `${nickname} | ${line}`,
        status,
        confidence: status === "OK" ? 1 : 0.4,
        sourceType: "OCR",
      });

      // 🔥 reset
      lastNickname = null;
    }
  }

  return dedupe(entries);
}

// =====================================
// 🧠 NICKNAME DETECTION
// =====================================
function isNickname(line: string): boolean {
  if (line.length < 3) return false;
  if (/donations/i.test(line)) return false;
  if (!/[a-z]/i.test(line)) return false;
  if (/^[^a-z0-9]+$/i.test(line)) return false;

  return true;
}

// =====================================
// 💰 VALUE
// =====================================
function extractValue(line: string): number | null {
  const match = line.match(/donations[:\s]*([\d,]+)/i);
  if (!match) return null;

  const value = parseInt(match[1].replace(/,/g, ""), 10);
  return isNaN(value) ? null : value;
}

// =====================================
// 🧹 DEDUPE
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