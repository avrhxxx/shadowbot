// src/quickadd/parsers/DuelPointsParser.ts

import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

// =====================================
// 🧠 CAN PARSE (TYLKO SCREENY)
// =====================================
export function canParseDuelPoints(lines: string[]): boolean {
  const matches = lines.filter(line =>
    /[\d]+[\.,]?\d*\s*[MK]/i.test(line)
  );

  // 🔥 musi być kilka wartości typu 36.5M
  return matches.length >= 3;
}

// =====================================
// 🔥 MAIN PARSER
// =====================================
export function parseDuelPoints(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  for (const rawLine of lines) {
    if (!rawLine) continue;

    let line = rawLine.trim();
    if (!line) continue;

    // =========================
    // ✍️ TRYB TEKSTOWY (manual)
    // =========================
    // np: Nick 36.5M / Nick 1200K
    const manualMatch = line.match(/^(.+?)\s+([\d.,]+)\s*([MK])$/i);
    if (manualMatch) {
      const nickname = cleanNickname(manualMatch[1]);
      const value = normalizeValue(
        manualMatch[2],
        manualMatch[3].toUpperCase()
      );

      if (!nickname || value <= 0) continue;

      entries.push({
        lineId: lineCounter++,
        nickname,
        value,
        raw: manualMatch[0],
        rawText: rawLine,
        status: "OK",
        confidence: 1,
        sourceType: "MANUAL",
      });

      continue;
    }

    // =========================
    // 🖼️ OCR TRYB
    // =========================

    // 🔥 musi zawierać wartość typu 36.59M / 1200K
    const valueMatch = line.match(/([\d.,]+)\s*([MK])/i);
    if (!valueMatch) continue;

    const fullMatch = valueMatch[0];
    const rawNumber = valueMatch[1];
    const suffix = valueMatch[2].toUpperCase();

    const value = normalizeValue(rawNumber, suffix);
    if (value <= 0) continue;

    // 🔥 usuń wartość z linii
    let nicknamePart = line.replace(fullMatch, "");

    // 🔥 usuń rank (np. "8 ", "#12 ")
    nicknamePart = nicknamePart.replace(/^[#\d]+\s*/, "");

    // 🔥 usuń tagi typu "#227 [XXX]"
    nicknamePart = nicknamePart.replace(/#\d+\s*\[[^\]]+\]/g, "");

    // 🔥 czyszczenie nicku
    const cleaned = cleanNickname(nicknamePart);

    // =========================
    // 🚨 FILTR ŚMIECI
    // =========================
    const isWeird =
      cleaned.length < 3 ||
      /^[\d\s]+$/.test(cleaned) ||
      cleaned.split(" ").length > 4;

    // ❌ NIE dodawaj totalnych śmieci
    if (!cleaned || cleaned.length < 2) continue;

    entries.push({
      lineId: lineCounter++,
      nickname: cleaned,
      value,
      raw: fullMatch,
      rawText: rawLine,
      status: isWeird ? "UNREADABLE" : "OK",
      confidence: isWeird ? 0.4 : 1,
      sourceType: "OCR",
    });
  }

  return entries;
}

// =====================================
// 🔥 "36.59M" → 36590000
// =====================================
function normalizeValue(num: string, suffix: string): number {
  const clean = num.replace(",", ".");
  const number = parseFloat(clean);

  if (isNaN(number)) return 0;

  if (suffix === "M") return Math.round(number * 1_000_000);
  if (suffix === "K") return Math.round(number * 1_000);

  return 0;
}

// =====================================
// 🔥 CLEAN NICKNAME (ULEPSZONE)
// =====================================
function cleanNickname(name: string): string {
  return name
    // usuń śmieci OCR
    .replace(/[ÔÇś@%*_=~`"'|\\]/g, "")

    // usuń leading garbage
    .replace(/^[^\p{L}\p{N}]+/u, "")

    // usuń trailing garbage
    .replace(/[^\p{L}\p{N}]+$/u, "")

    // zostaw sensowne znaki
    .replace(/[^\p{L}\p{N}\s_|-]/gu, "")

    // normalize spaces
    .replace(/\s+/g, " ")
    .trim();
}