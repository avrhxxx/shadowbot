// src/quickadd/detector/ImageTypeDetector.ts

import { ParserType } from "../session/SessionManager";

// =====================================
// 🔥 MAIN DETECTOR
// =====================================
export function detectImageType(lines: string[]): ParserType | null {
  console.log("🧠 === IMAGE TYPE DETECTION START ===");
  console.log(`📥 Lines count: ${lines.length}`);

  const scores: Record<ParserType, number> = {
    DONATIONS: 0,
    DUEL_POINTS: 0,
    RR_RAID: 0,
    RR_ATTENDANCE: 0,
  };

  // =====================================
  // 🔍 ANALYZE LINES
  // =====================================
  lines.forEach((line, index) => {
    const lower = line.toLowerCase();

    console.log(`\n🔎 [${index}] "${line}"`);

    // =========================
    // 💰 DONATIONS
    // =========================
    if (/donat|ionat|contribution/i.test(line)) {
      scores.DONATIONS += 2;
      console.log("   ➕ DONATIONS +2 (keyword)");
    }

    if (/\d{4,}/.test(line)) {
      scores.DONATIONS += 0.5;
      console.log("   ➕ DONATIONS +0.5 (big number)");
    }

    // =========================
    // ⚔️ DUEL POINTS
    // =========================
    if (/[\d]+[\.,]?\d*\s*[mk]/i.test(line)) {
      scores.DUEL_POINTS += 2;
      console.log("   ➕ DUEL_POINTS +2 (M/K format)");
    }

    // =========================
    // 🪖 RESERVOIR RAID
    // =========================
    if (/no\s*team/i.test(lower)) {
      scores.RR_RAID += 2;
      console.log("   ➕ RR_RAID +2 (no team)");
    }

    if (lower.includes("main force") || lower.includes("reserve")) {
      scores.RR_RAID += 1;
      console.log("   ➕ RR_RAID +1 (group hint)");
    }

    // =========================
    // 📋 ATTENDANCE
    // =========================
    if (lower.includes("attend")) {
      scores.RR_ATTENDANCE += 2;
      console.log("   ➕ RR_ATTENDANCE +2 (keyword)");
    }
  });

  // =====================================
  // 📊 FINAL SCORES
  // =====================================
  console.log("\n📊 === DETECTOR SCORES ===");
  Object.entries(scores).forEach(([type, score]) => {
    console.log(`   ${type}: ${score}`);
  });

  // =====================================
  // 🏆 PICK BEST
  // =====================================
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  const best = sorted[0];
  const second = sorted[1];

  if (!best) {
    console.log("❌ No candidates");
    return null;
  }

  // 🔥 threshold minimalny
  if (best[1] < 2) {
    console.log(`❌ Weak match: ${best[0]} (${best[1]})`);
    return null;
  }

  // 🔥 jeśli remis → brak pewności
  if (second && best[1] === second[1]) {
    console.log(
      `⚠️ Tie detected: ${best[0]} (${best[1]}) vs ${second[0]} (${second[1]})`
    );
    return null;
  }

  console.log(
    `✅ DETECTED TYPE: ${best[0]} (score: ${best[1]})`
  );

  console.log("🧠 === IMAGE TYPE DETECTION END ===\n");

  return best[0] as ParserType;
}