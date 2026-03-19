import { QuickAddEntry } from "../types/QuickAddEntry";

let lineCounter = 1;

export function parseDonations(lines: string[]): QuickAddEntry[] {
  const entries: QuickAddEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const lower = line.toLowerCase();

    // ❌ skip śmieci systemowe
    if (lower.includes("at least")) continue;
    if (lower.includes("rewards")) continue;
    if (!lower.includes("donations")) continue;

    // 🔥 value
    const valueMatch = line.match(/([\d]{2,3}(?:[,.\s]\d{3})+|\d{4,})/);
    if (!valueMatch) continue;

    const raw = valueMatch[0];
    const value = parseInt(raw.replace(/[^\d]/g, ""));
    if (!value || value < 1000) continue;

    // 🔥 SZUKANIE NICKA (look-back do 2 linii)
    let nickname = "UNKNOWN";

    for (let j = 1; j <= 2; j++) {
      const candidate = lines[i - j];
      if (!candidate) continue;

      const cleaned = cleanNickname(candidate);

      if (
        cleaned.length >= 3 &&
        !cleaned.toLowerCase().includes("donations")
      ) {
        nickname = cleaned;
        break;
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

// 🔥 CLEAN (ważne)
function cleanNickname(name: string): string {
  return (
    name
      // usuń OCR śmieci typu ÔÇś
      .replace(/[^\w\d\s_]/g, "")
      // 🔥 usuń prefixy typu "g ", "a4 ", "R "
      .replace(/^[a-zA-Z0-9]{1,3}\s+/i, "")
      // usuń wielokrotne spacje
      .replace(/\s+/g, " ")
      .trim()
  );
}