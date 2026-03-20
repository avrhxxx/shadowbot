// src/quickadd/detector/ImageTypeDetector.ts

import { ParserType } from "../session/SessionManager";

export function detectImageType(lines: string[]): ParserType | null {
  const scores: Record<ParserType, number> = {
    DONATIONS: 0,
    DUEL_POINTS: 0,
    RR_RAID: 0,
    RR_ATTENDANCE: 0,
  };

  for (const line of lines) {
    const lower = line.toLowerCase();

    // =========================
    // 💰 DONATIONS
    // =========================
    if (/donat|ionat|contribution/i.test(line)) {
      scores.DONATIONS += 2;
    }

    if (/\d{4,}/.test(line)) {
      scores.DONATIONS += 0.5;
    }

    // =========================
    // ⚔️ DUEL POINTS
    // =========================
    if (/[\d]+[\.,]?\d*\s*[mk]/i.test(line)) {
      scores.DUEL_POINTS += 2;
    }

    // =========================
    // 🪖 RESERVOIR RAID
    // =========================
    if (/no\s*team/i.test(lower)) {
      scores.RR_RAID += 2;
    }

    if (lower.includes("main force") || lower.includes("reserve")) {
      scores.RR_RAID += 1;
    }

    // =========================
    // 📋 ATTENDANCE (placeholder)
    // =========================
    if (lower.includes("attend")) {
      scores.RR_ATTENDANCE += 2;
    }
  }

  console.log("=== DETECTOR SCORES ===");
  console.log(scores);

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];

  if (!best || best[1] < 2) {
    console.log("❌ No strong match");
    return null;
  }

  console.log(`✅ DETECTED TYPE: ${best[0]}`);
  return best[0] as ParserType;
}