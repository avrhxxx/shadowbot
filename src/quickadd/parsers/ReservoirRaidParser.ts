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

    // 🔥 usuń końcówki typu "=~"
    nickname = nickname.replace(/[=~]+$/, "");

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
// 🧹 CLEAN NICKNAME (UNICODE SAFE)
// =====================================
function cleanNickname(name: string): string {
  return name
    // usuń śmieci OCR
    .replace(/[ÔÇś@%\\]/g, "")

    // usuń śmieci z początku (obsługa wszystkich alfabetów)
    .replace(/^[^\p{L}\p{N}]+/u, "")

    // usuń śmieci z końca
    .replace(/[^\p{L}\p{N}]+$/u, "")

    // usuń dziwne znaki w środku (zostaw litery, cyfry, spacje, _, |, -)
    .replace(/[^\p{L}\p{N}\s_|-]/gu, "")

    // normalizacja spacji
    .replace(/\s+/g, " ")
    .trim();
}