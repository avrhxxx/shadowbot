// src/quickadd/parsers/ReservoirRaidParser.ts

import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

// =====================================
// 🧠 CAN PARSE (SCREEN DETECT)
// =====================================
export function canParseReservoirRaid(lines: string[]): boolean {
  if (!lines || lines.length === 0) return false;

  const text = lines.join(" ").toLowerCase();

  // 🔥 typowe słowa z raidu
  if (
    text.includes("no team") ||
    text.includes("noteam") ||
    text.includes("raid")
  ) {
    return true;
  }

  // 🔥 fallback — kilka wystąpień "No Team"
  const matches = lines.filter(line =>
    /no\s*team/i.test(line)
  );

  return matches.length >= 2;
}

// =====================================
// 🔥 MAIN PARSER
// =====================================
export function parseReservoirRaid(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  let currentGroup: "MAIN" | "RESERVE" = "MAIN";

  for (const rawLine of lines) {
    if (!rawLine) continue;

    const line = rawLine.trim();
    if (!line) continue;

    const lower = line.toLowerCase();

    // =========================
    // 🧠 DETECT GROUP (OCR SAFE)
    // =========================
    if (
      (lower.includes("main") && lower.includes("force")) ||
      lower.includes("mainforce")
    ) {
      currentGroup = "MAIN";
      continue;
    }

    if (lower.includes("reserv")) {
      currentGroup = "RESERVE";
      continue;
    }

    // =========================
    // 🔍 MATCH NICK
    // =========================
    const match =
      line.match(/\(No\s*Team\)\s*(.+)/i) ||
      line.match(/\(NoTeam\)\s*(.+)/i) ||
      line.match(/No\s*Team\)?\s*(.+)/i);

    if (!match) continue;

    let nickname = match[1];
    if (!nickname) continue;

    // 🔥 CLEAN (Unicode-safe)
    nickname = cleanNickname(nickname);

    if (!nickname || nickname.length < 2) continue;

    entries.push(
      createEntry(
        rawLine,
        nickname,
        0,
        "RESERVOIR_RAID",
        currentGroup
      )
    );
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
  group?: "MAIN" | "RESERVE"
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
    group,
  };
}

// =====================================
// 🧹 CLEAN NICKNAME (FINAL)
// =====================================
function cleanNickname(name: string): string {
  return name
    // usuń śmieci OCR
    .replace(/[ÔÇś@%\\]/g, "")

    // usuń śmieci z początku (unicode safe)
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