// src/quickadd/detector/ImageTypeDetector.ts

import { ParserType } from "../session/SessionManager";

// =====================================
// 🔍 IMAGE TYPE DETECTOR
// =====================================
export function detectImageType(lines: string[]): ParserType | null {
  console.log("=================================");
  console.log("🧠 DETECTOR START");
  console.log("=================================");

  if (!lines || lines.length === 0) {
    console.log("❌ No lines provided to detector");
    return null;
  }

  console.log(`📄 Lines count: ${lines.length}`);

  const scores: Record<ParserType, number> = {
    DONATIONS: 0,
    DUEL_POINTS: 0,
    RR_RAID: 0,
    RR_ATTENDANCE: 0,
  };

  let lineIndex = 0;

  for (const line of lines) {
    const lower = line.toLowerCase();

    console.log(`\n🔎 [${lineIndex}] "${line}"`);

    // =========================
    // 💰 DONATIONS
    // =========================
    if (/donat|ionat|contribution/i.test(line)) {
      scores.DONATIONS += 2;
      console.log("➕ DONATIONS +2 (keyword)");
    }

    if (/\d{4,}/.test(line)) {
      scores.DONATIONS += 0.5;
      console.log("➕ DONATIONS +0.5 (large number)");
    }

    // =========================
    // ⚔️ DUEL POINTS
    // =========================
    if (/[\d]+[\.,]?\d*\s*[mk]/i.test(line)) {
      scores.DUEL_POINTS += 2;
      console.log("➕ DUEL_POINTS +2 (k/m format)");
    }

    // =========================
    // 🪖 RESERVOIR RAID
    // =========================
    if (/no\s*team/i.test(lower)) {
      scores.RR_RAID += 2;
      console.log("➕ RR_RAID +2 (no team)");
    }

    if (lower.includes("main force")) {
      scores.RR_RAID += 1;
      console.log("➕ RR_RAID +1 (main force)");
    }

    if (lower.includes("reserve")) {
      scores.RR_RAID += 1;
      console.log("➕ RR_RAID +1 (reserve)");
    }

    // =========================
    // 📋 ATTENDANCE
    // =========================
    if (lower.includes("attend")) {
      scores.RR_ATTENDANCE += 2;
      console.log("➕ RR_ATTENDANCE +2 (attend)");
    }

    lineIndex++;
  }

  console.log("\n=================================");
  console.log("📊 FINAL SCORES:");
  console.log(scores);
  console.log("=================================");

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  const best = sorted[0];

  if (!best) {
    console.log("❌ No detection result");
    return null;
  }

  const [type, score] = best;

  console.log(`🏆 BEST MATCH: ${type} (${score})`);

  // 🔥 próg bezpieczeństwa
  if (score < 2) {
    console.log("❌ Score too low → rejecting detection");
    return null;
  }

  // 🔥 dodatkowy safeguard (jeśli remis)
  if (sorted.length > 1 && sorted[1][1] === score) {
    console.log("⚠️ Tie detected → ambiguous result, returning null");
    return null;
  }

  console.log(`✅ DETECTED TYPE: ${type}`);
  console.log("=================================\n");

  return type as ParserType;
}