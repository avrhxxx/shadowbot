import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

export function parseDonations(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 🔥 interesują nas tylko linie z Donations
    if (!/Donations/i.test(line)) continue;

    // 🔢 value
    const valueMatch = line.match(/([\d]{2,3}(?:[, ]\d{3})*)/);
    if (!valueMatch) continue;

    const rawNumber = valueMatch[1];
    const value = parseInt(rawNumber.replace(/[^\d]/g, ""));

    if (!value || value < 1000) continue;

    // 🔥 NICK = poprzednia linia
    const prevLine = lines[i - 1] || "";

    let nickname = cleanNickname(prevLine);

    if (!nickname || nickname.length < 3) {
      nickname = "UNKNOWN";
    }

    const status =
      nickname === "UNKNOWN" ? "UNREADABLE" : "OK";

    entries.push({
      lineId: lineCounter++,
      nickname,
      value,
      raw: rawNumber,
      rawText: `${prevLine} | ${line}`,
      status,
      confidence: status === "OK" ? 1 : 0.5,
      sourceType: "OCR",
    });
  }

  return entries;
}

function cleanNickname(name: string): string {
  return name
    .replace(/[^\w\d\s_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}