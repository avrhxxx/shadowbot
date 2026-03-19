import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

export function parseReservoirAttendance(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  for (const rawLine of lines) {
    if (!rawLine) continue;

    let line = rawLine.trim();
    if (!line) continue;

    // =========================
    // 🧹 USUŃ POZYCJĘ (1, 2, 3...)
    // =========================
    line = line.replace(/^\d+\s*/, "");

    // =========================
    // 🧹 USUŃ PUNKTY (1,234,567)
    // =========================
    line = line.replace(/[\d,]+$/, "");

    // =========================
    // 🧹 CLEAN NICK (UNICODE SAFE)
    // =========================
    const nickname = cleanNickname(line);

    if (!nickname || nickname.length < 2) continue;

    entries.push(createEntry(rawLine, nickname, 1, "ATTEND"));
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
  raw: string
): QuickAddEntry {
  return {
    lineId: lineCounter++,
    rawText,
    nickname,
    value,
    raw,
    status: "OK",
    confidence: 1,
    sourceType: "OCR",
  };
}

// =====================================
// 🧹 CLEAN NICKNAME (TAKA SAMA JAK RAID)
// =====================================
function cleanNickname(name: string): string {
  return name
    // usuń śmieci OCR
    .replace(/[ÔÇś@%\\]/g, "")

    // usuń śmieci z początku
    .replace(/^[^\p{L}\p{N}]+/gu, "")

    // usuń końcówki typu "=~"
    .replace(/[=~]+$/, "")

    // usuń śmieci z końca (ale zostaw dekoracje)
    .replace(/[^\p{L}\p{N}_| -]+$/gu, "")

    // usuń dziwne znaki w środku
    .replace(/[^\p{L}\p{N}\s_|-]/gu, "")

    // normalizacja spacji
    .replace(/\s+/g, " ")
    .trim();
}