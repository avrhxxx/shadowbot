// src/quickadd/parsers/DonationsParser.ts

import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

// =====================================
// 🧠 CAN PARSE (TYLKO DO SCREENÓW)
// =====================================
export function canParseDonations(lines: string[]): boolean {
  const hits = lines.filter(l =>
    l.toLowerCase().includes("donations")
  ).length;

  // 🔥 musi być więcej niż 1 — żeby uniknąć false positive
  return hits >= 2;
}

// =====================================
// 🔥 MAIN PARSER
// =====================================
export function parseDonations(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  let lastNickname: string | null = null;

  for (let rawLine of lines) {
    const line = rawLine.trim();

    if (!line) continue;

    // =========================
    // ✍️ TRYB TEKSTOWY (manual input)
    // =========================
    // np: Nick 3000
    const manualMatch = line.match(/^(.+?)\s+(\d{3,})$/);
    if (manualMatch) {
      const nickname = normalizeNickname(manualMatch[1]);
      const value = parseInt(manualMatch[2], 10);

      if (!nickname || isNaN(value)) continue;

      entries.push({
        lineId: lineCounter++,
        nickname,
        value,
        raw: rawLine,
        rawText: rawLine,
        status: "OK",
        confidence: 1,
        sourceType: "MANUAL",
      });

      continue;
    }

    // =========================
    // 🧠 DETECT NICK (OCR)
    // =========================
    if (isNickname(line)) {
      lastNickname = line;
      continue;
    }

    // =========================
    // 💰 DONATIONS LINE (OCR)
    // =========================
    if (/donations/i.test(line)) {
      const value = extractValue(line);

      // 🔥 filtr śmieci
      if (!value || value < 1000) continue;

      const nickname = normalizeNickname(lastNickname || "");

      // ❌ nie dodawaj UNKNOWN (usuwa spam)
      if (!nickname || nickname.length < 2) {
        lastNickname = null;
        continue;
      }

      entries.push({
        lineId: lineCounter++,
        nickname,
        value,
        raw: rawLine,
        rawText: `${lastNickname ?? "??"} | ${line}`,
        status: "OK",
        confidence: 1,
        sourceType: "OCR",
      });

      lastNickname = null;
    }
  }

  return entries;
}

// =====================================
// 🧠 NICKNAME CHECK (OCR)
// =====================================
function isNickname(line: string): boolean {
  const lower = line.toLowerCase();

  return (
    line.length >= 3 &&
    /[a-z]/i.test(line) &&
    !lower.includes("donations") &&
    !lower.includes("ranking") &&
    !lower.includes("total") &&
    !lower.includes("alliance") &&
    !/\d{4,}/.test(line) // ❌ usuń linie z dużymi liczbami
  );
}

// =====================================
// 💰 VALUE EXTRACT
// =====================================
function extractValue(line: string): number | null {
  const match = line.match(/donations[:\s]*([\d,]+)/i);
  if (!match) return null;

  const value = parseInt(match[1].replace(/,/g, ""), 10);
  return isNaN(value) ? null : value;
}

// =====================================
// 🔥 FINAL NICKNAME CLEANER
// =====================================
function normalizeNickname(name: string): string {
  let cleaned = name.trim();

  // 🔥 prefixy OCR
  cleaned = cleaned.replace(/^[a-z]\s+/i, "");
  cleaned = cleaned.replace(/^[a-z]\d+\s+/i, "");
  cleaned = cleaned.replace(/^\d+\s+/i, "");

  // 🔥 dekoracje
  cleaned = cleaned.replace(/[<>]/g, "");

  // 🔥 leading garbage
  cleaned = cleaned.replace(/^[^a-zA-Z]+/, "");

  // 🔥 końcówki OCR
  cleaned = cleaned.replace(/\s+[a-z]$/i, "");

  // 🔥 final clean
  cleaned = cleaned.replace(/[^\w\d_]/g, "");

  return cleaned.trim();
}