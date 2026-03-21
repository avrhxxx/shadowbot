// src/quickadd/detector/ImageTypeDetector.ts

import { ParserType } from "../session/SessionManager";

export function detectImageType(
  lines: string[],
  lockedType?: ParserType | null
): ParserType | null {
  if (lockedType) return lockedType;
  if (!lines?.length) return null;

  const scores: Record<ParserType, number> = {
    DONATIONS: 0,
    DUEL_POINTS: 0,
    RR_RAID: 0,
    RR_ATTENDANCE: 0,
  };

  let bigNumbers = 0;
  let donationLike = 0;

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (/\d{4,6}/.test(line)) bigNumbers++;

    if (/[a-z].*\d{4,6}/i.test(line)) {
      donationLike++;
    }

    if (/donat|d0nat|donat1|e.?st.?ons/i.test(line)) {
      scores.DONATIONS += 3;
    }

    if (/rank/i.test(line)) {
      scores.DONATIONS += 1;
    }

    if (/[\d]+[\.,]?\d*\s*[mk]/i.test(line) && !/donat/i.test(line)) {
      scores.DUEL_POINTS += 2;
    }
  }

  if (bigNumbers >= 5) scores.DONATIONS += 3;
  if (donationLike >= 3) scores.DONATIONS += 3;

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topType, topScore] = sorted[0];

  if (topScore < 3) return null;

  return topType as ParserType;
}