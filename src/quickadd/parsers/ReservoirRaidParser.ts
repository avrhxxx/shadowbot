import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

// =====================================
// 🧠 CAN PARSE (AUTODETECT)
// =====================================
export function canParseReservoirRaid(lines: string[]): boolean {
  const hits = lines.filter(line =>
    line.toLowerCase().includes("no team")
  ).length;

  return hits >= 2;
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