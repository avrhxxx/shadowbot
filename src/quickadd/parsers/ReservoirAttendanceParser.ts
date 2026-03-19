// src/quickadd/parsers/ReservoirAttendanceParser.ts

import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

// =====================================
// 🧠 CAN PARSE (KLUCZOWE!!!)
// =====================================
export function canParseReservoirAttendance(lines: string[]): boolean {
  let validLines = 0;

  for (const line of lines) {
    if (!line) continue;

    const trimmed = line.trim();

    // np: "12 Nickname 12345"
    if (/^\d+\s+[^\d]{2,}\s+\d{3,}/.test(trimmed)) {
      validLines++;
    }
  }

  // 🔥 musi być kilka takich linii
  return validLines >= 3;
}

// =====================================
// 🔥 MAIN PARSER
// =====================================
export function parseReservoirAttendance(
  lines: string[]
): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  for (const rawLine of lines) {
    if (!rawLine) continue;

    let line = rawLine.trim();
    if (!line) continue;

    // =========================
    // ✍️ TRYB TEKSTOWY (manual)
    // =========================
    // np: Nick
    if (/^[^\d]{2,}$/.test(line)) {
      const nickname = cleanNickname(line);

      if (!nickname || nickname.length < 2) continue;

      entries.push(createEntry(rawLine, nickname, 1, "ATTEND", "MANUAL"));
      continue;
    }

    // =========================
    // 🖼️ OCR TRYB
    // =========================

    // ❌ musi wyglądać jak ranking
    // np: "12 Nickname 12345"
    if (!/^\d+\s+.+\s+\d{3,}/.test(line)) continue;

    // 🧹 usuń pozycję
    line = line.replace(/^\d+\s*/, "");

    // 🧹 usuń punkty
    line = line.replace(/[\d,]+$/, "");

    const nickname = cleanNickname(line);

    // 🚨 filtr śmieci
    if (
      !nickname ||
      nickname.length < 2 ||
      nickname.split(" ").length > 3
    ) {
      continue;
    }

    entries.push(createEntry(rawLine, nickname, 1, "ATTEND", "OCR"));
  }

  return entries;
}

// =====================================
// 🔧 CREATE ENTRY
// =====================================
function createEntry(
  rawText: string,
  nickname: string,
  value: number,
  raw: string,
  sourceType: "OCR" | "MANUAL"
): QuickAddEntry {
  return {
    lineId: lineCounter++,
    rawText,
    nickname,
    value,
    raw,
    status: "OK",
    confidence: 1,
    sourceType,
  };
}

// =====================================
// 🧹 CLEAN NICKNAME (ULEPSZONE)
// =====================================
function cleanNickname(name: string): string {
  return name
    // OCR garbage
    .replace(/[ÔÇś@%\\]/g, "")

    // leading junk
    .replace(/^[^\p{L}\p{N}]+/gu, "")

    // trailing junk
    .replace(/[^\p{L}\p{N}_| -]+$/gu, "")

    // usuń końcówki typu "=~"
    .replace(/[=~]+$/, "")

    // tylko sensowne znaki
    .replace(/[^\p{L}\p{N}\s_|-]/gu, "")

    // normalize
    .replace(/\s+/g, " ")
    .trim();
}