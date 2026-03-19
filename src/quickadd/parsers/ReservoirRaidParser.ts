import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

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
    if (lower.includes("main") && lower.includes("force")) {
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

    // 🔥 usuń końcówki typu "=~"
    nickname = nickname.replace(/[=~]+$/, "");

    // 🔥 clean OCR
    nickname = cleanNickname(nickname);

    if (!nickname || nickname.length < 2) continue;

    entries.push(
      createEntry(
        rawLine,
        nickname,
        0, // 🔥 brak sensownej wartości → 0
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
    // usuń śmieci OCR
    .replace(/[ÔÇś@%\\]/g, "")

    // usuń śmieci z początku
    .replace(/^[^a-zA-Z0-9]+/, "")

    // usuń śmieci z końca (najważniejsze)
    .replace(/[^a-zA-Z0-9]+$/, "")

    // usuń dziwne znaki w środku (zostaw _ i spacje)
    .replace(/[^\w\d\s_|-]/g, "")

    // normalizacja spacji
    .replace(/\s+/g, " ")
    .trim();
}