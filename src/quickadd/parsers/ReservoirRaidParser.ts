import { QuickAddEntry } from "../types/QuickAddEntry";

export function parseReservoirRaid(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  for (const rawLine of lines) {
    if (!rawLine) continue;

    const line = rawLine.trim();
    if (!line) continue;

    // 🔹 różne warianty OCR "No Team"
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
      value: 1, // 🔥 zawsze 1 (jak attendance)
      raw: "RAID",
    });
  }

  return entries;
}

// 🔹 czyści nickname z OCR śmieci
function cleanNickname(name: string): string {
  return name.replace(/[^\w\d_]/g, "").trim();
}