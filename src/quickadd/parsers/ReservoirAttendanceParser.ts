import { QuickAddEntry } from "../types/QuickAddEntry";

export function parseReservoirAttendance(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  for (const rawLine of lines) {
    if (!rawLine) continue;

    let line = rawLine.trim();
    if (!line) continue;

    // 🔹 usuń rank (np. "1 ")
    line = line.replace(/^\d+\s*/, "");

    // 🔹 usuń liczby na końcu (czasem OCR dorzuca śmieci)
    line = line.replace(/[\d,]+$/, "");

    const nickname = cleanNickname(line);
    if (!nickname) continue;

    entries.push({
      nickname,
      value: 1, // 🔥 attendance = 1
      raw: "ATTEND",
    });
  }

  return entries;
}

// 🔹 czyści nickname z OCR śmieci
function cleanNickname(name: string): string {
  return name.replace(/[^\w\d_]/g, "").trim();
}