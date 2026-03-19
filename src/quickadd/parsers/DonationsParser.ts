import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

export function parseDonations(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const lower = line.toLowerCase();

    // 🔥 szukamy linii z Donations
    if (!lower.includes("donations")) continue;

    // 🔥 znajdź wartość
    const valueMatch = line.match(/([\d]{2,3}(?:[,.\s]\d{3})+|\d{4,})/);
    if (!valueMatch) continue;

    const raw = valueMatch[0];
    const value = parseInt(raw.replace(/[^\d]/g, ""));

    if (!value || value < 1000) continue;

    // 🔥 szukamy nicka NAD linią
    let nickname = "UNKNOWN";

    const prevLine = lines[i - 1];
    if (prevLine) {
      const cleaned = cleanNickname(prevLine);

      if (cleaned.length >= 3 && !cleaned.toLowerCase().includes("donations")) {
        nickname = cleaned;
      }
    }

    entries.push({
      lineId: lineCounter++,
      nickname,
      value,
      raw,
      rawText: line,
      status: nickname === "UNKNOWN" ? "UNREADABLE" : "OK",
      confidence: nickname === "UNKNOWN" ? 0.5 : 1,
      sourceType: "OCR",
    });
  }

  return entries;
}

// 🔥 czyszczenie nicków
function cleanNickname(name: string): string {
  return (
    name
      .replace(/[^\w\d\s_]/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}