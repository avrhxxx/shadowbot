export function detectParserType(lines: string[]): ParserType {
  if (!lines || lines.length === 0) return "UNKNOWN";

  if (lines.length > 200) return "UNKNOWN";

  const text = lines.join(" ").toLowerCase();

  let score = {
    RR_RAID: 0,
    RR_ATTENDANCE: 0,
    DONATIONS: 0,
    DUEL_POINTS: 0,
  };

  // =========================
  // 🟣 DONATIONS
  // =========================
  if (text.includes("donation")) score.DONATIONS += 3;

  // =========================
  // 🔵 DUEL
  // =========================
  if (text.includes("rank")) score.DUEL_POINTS += 1;
  if (text.includes("player")) score.DUEL_POINTS += 1;
  if (text.includes("points")) score.DUEL_POINTS += 1;
  if (text.match(/\d+\.\d+M/)) score.DUEL_POINTS += 2;

  // =========================
  // 🟢 RAID
  // =========================
  if (text.includes("no team")) score.RR_RAID += 2;
  if (text.includes("raid")) score.RR_RAID += 1;
  if (text.includes("score")) score.RR_RAID += 1;
  if (text.includes("leadership")) score.RR_RAID += 2;

  // =========================
  // 🟡 ATTENDANCE
  // =========================
  const hasRanks = (text.match(/\b\d{1,2}\b/g) || []).length > 5;
  const hasBigNumbers = (text.match(/\d{3,}/g) || []).length > 5;

  if (hasRanks) score.RR_ATTENDANCE += 2;
  if (hasBigNumbers) score.RR_ATTENDANCE += 2;

  // ❌ ale nie jeśli to inne tryby
  if (score.DONATIONS > 0) score.RR_ATTENDANCE -= 2;
  if (score.RR_RAID > 2) score.RR_ATTENDANCE -= 2;

  // =========================
  // 🧠 WYBÓR NAJLEPSZEGO
  // =========================
  const best = Object.entries(score).sort((a, b) => b[1] - a[1])[0];

  if (!best || best[1] <= 1) return "UNKNOWN";

  return best[0] as ParserType;
}