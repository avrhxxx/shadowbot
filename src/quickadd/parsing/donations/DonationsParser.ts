// src/quickadd/parsing/donations/DonationsParser.ts
export function parseDonations(lines: string[]) {
  const results: { nickname: string; value: number }[] = [];

  function normalizeNumber(str: string): number {
    return parseInt(str.replace(/[^\d]/g, ""), 10);
  }

  function isValidNickname(str: string): boolean {
    if (!str) return false;

    const clean = str.trim();

    if (clean.length < 3) return false;

    // wyklucz śmieci
    if (/^[^a-zA-Z0-9]+$/.test(clean)) return false;

    if (clean.toLowerCase().includes("donations")) return false;
    if (clean.toLowerCase().includes("ranking")) return false;
    if (clean.toLowerCase().includes("rewards")) return false;

    return true;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line.toLowerCase().includes("donations")) continue;

    const numberMatch = line.match(/[\d\s,]+/);

    if (!numberMatch) continue;

    const value = normalizeNumber(numberMatch[0]);

    // 🔥 SZUKAMY NICKA (kolejna sensowna linia)
    let nickname = "";

    for (let j = i + 1; j < i + 4 && j < lines.length; j++) {
      const candidate = lines[j]?.trim();

      if (isValidNickname(candidate)) {
        nickname = candidate;
        break;
      }
    }

    if (!nickname) continue;

    results.push({ nickname, value });
  }

  return results;
}