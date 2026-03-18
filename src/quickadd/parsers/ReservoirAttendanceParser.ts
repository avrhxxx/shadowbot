import { QuickAddEntry } from "../types/QuickAddEntry";

export function parseReservoirAttendance(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  for (const rawLine of lines) {
    if (!rawLine) continue;

    let line = rawLine.trim();
    if (!line) continue;

    line = line.replace(/^\d+\s*/, "");
    line = line.replace(/[\d,]+$/, "");

    const nickname = cleanNickname(line);
    if (!nickname) continue;

    entries.push({
      nickname,
      value: "1", // 🔥 FIX
      raw: "ATTEND",
    });
  }

  return entries;
}

function cleanNickname(name: string): string {
  return name.replace(/[^\w\d_]/g, "").trim();
}