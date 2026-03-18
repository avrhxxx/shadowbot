import { QuickAddEntry } from "../types/QuickAddEntry";

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

    const nicknameRaw = match[1].trim();
    const nickname = cleanNickname(nicknameRaw);

    if (!nickname) continue;

    entries.push({
      nickname,
      value: "1", // 🔥 FIX
      raw: "RAID",
    });
  }

  return entries;
}

function cleanNickname(name: string): string {
  return name.replace(/[^\w\d_]/g, "").trim();
}