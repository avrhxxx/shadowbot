// src/quickadd/parsers/ReservoirRaidParser.ts

import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

// =====================================
// 🧠 CAN PARSE (PRECYZYJNY)
// =====================================
export function canParseReservoirRaid(lines: string[]): boolean {
  if (!lines || lines.length === 0) return false;

  const text = lines.join(" ").toLowerCase();

  // 🔥 musi zawierać "No Team"
  const hasNoTeam = /no\s*team/i.test(text);

  // 🔥 musi mieć kilka takich wpisów (typowe dla listy raid)
  const count = lines.filter(line =>
    /no\s*team/i.test(line)
  ).length;

  // 🔥 opcjonalnie group hints
  const hasGroupHints =
    text.includes("main force") ||
    text.includes("mainforce") ||
    text.includes("reserve");

  return hasNoTeam && (count >= 2 || hasGroupHints);
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
    // 🧠 DETECT GROUP
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
// 🧹 CLEAN NICKNAME
// =====================================
function cleanNickname(name: string): string {
  return name
    .replace(/[ÔÇś@%\\]/g, "")
    .replace(/^[^\p{L}\p{N}]+/gu, "")
    .replace(/[=~]+$/, "")
    .replace(/[^\p{L}\p{N}_| -]+$/gu, "")
    .replace(/[^\p{L}\p{N}\s_|-]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}