import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

export function parseReservoirRaid(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  for (const rawLine of lines) {
    if (!rawLine) continue;

    const line = rawLine.trim();
    if (!line) continue;

    const match =
      line.match(/\(No\s*Team\)\s*(.+)/i) ||
      line.match(/\(NoTeam\)\s*(.+)/i) ||
      line.match(/No\s*Team\)?\s*(.+)/i);

    if (!match) continue;

    let nickname = match[1];
    if (!nickname) continue;

    // 🔥 dodatkowe czyszczenie końcówki typu "=~"
    nickname = nickname.replace(/[=~]+$/, "");

    // 🔥 główne czyszczenie nicka
    nickname = cleanNickname(nickname);

    if (!nickname || nickname.length < 2) continue;

    entries.push(createEntry(rawLine, nickname, 1, "RAID"));
  }

  return entries;
}

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
// 🧹 CLEAN NICKNAME
// =====================================
function cleanNickname(name: string): string {
  return name
    // usuń śmieci OCR
    .replace(/[ÔÇś@%\\]/g, "")

    // usuń śmieci na początku
    .replace(/^[^a-zA-Z0-9]+/, "")

    // usuń śmieci na końcu (najważniejsze)
    .replace(/[^a-zA-Z0-9]+$/, "")

    // usuń dziwne znaki w środku (zostaw spacje i _)
    .replace(/[^\w\d\s_-]/g, "")

    // normalizacja spacji
    .replace(/\s+/g, " ")
    .trim();
}