export function preprocessOCR(
  lines: string[],
  parserType: string
): string[] {
  // 🔥 SPECJALNY FIX tylko dla Duel Points
  if (parserType === "DUEL_POINTS") {
    return filterDuelPoints(lines);
  }

  return lines;
}

// 🔥 usuwa "zielonego usera"
function filterDuelPoints(lines: string[]): string[] {
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 🔹 wykrycie "Player" sekcji (to jest TEN DÓŁ)
    if (/player/i.test(line)) {
      // 🔥 skipujemy kilka linijek po tym
      i += 5;
      continue;
    }

    // 🔹 pomijamy śmieci typu pojedyncze liczby
    if (/^\d+$/.test(line.trim())) continue;

    result.push(line);
  }

  return result;
}