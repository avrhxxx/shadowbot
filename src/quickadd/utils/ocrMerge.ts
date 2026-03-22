// src/quickadd/utils/ocrMerge.ts

export function mergeOCRResults(texts: string[]): string {
  const linesSets = texts.map(t =>
    t
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean)
  );

  const maxLen = Math.max(...linesSets.map(l => l.length));
  const merged: string[] = [];

  for (let i = 0; i < maxLen; i++) {
    const candidates = linesSets
      .map(set => set[i])
      .filter(Boolean);

    if (candidates.length === 0) continue;

    const best = pickBestLine(candidates);
    merged.push(best);
  }

  return merged.join("\n");
}

// 🔥 MAGIC — scoring linii
function pickBestLine(lines: string[]): string {
  let best = lines[0];
  let bestScore = scoreLine(best);

  for (const line of lines.slice(1)) {
    const score = scoreLine(line);
    if (score > bestScore) {
      best = line;
      bestScore = score;
    }
  }

  return best;
}

function scoreLine(line: string): number {
  let score = 0;

  // długość
  score += Math.min(line.length, 50);

  // zawiera liczby
  if (/\d/.test(line)) score += 20;

  // donations keyword
  if (/donations/i.test(line)) score += 30;

  // mniej śmieci = lepiej
  const garbage = (line.match(/[^a-zA-Z0-9\s:,]/g) || []).length;
  score -= garbage * 2;

  return score;
}