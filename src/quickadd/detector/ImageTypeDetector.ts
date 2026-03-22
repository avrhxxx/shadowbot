// src/quickadd/detector/ImageTypeDetector.ts

import { ParserType } from "../session/sessionStore";

// =====================================
// 🔥 DEBUG
// =====================================
const DEBUG_DETECTOR = true;

function log(...args: any[]) {
  if (DEBUG_DETECTOR) {
    console.log("[DETECTOR]", ...args);
  }
}

// =====================================
export function detectImageType(
  lines: string[],
  lockedType?: ParserType | null
): ParserType | null {
  if (lockedType) {
    log("🔒 LOCKED TYPE:", lockedType);
    return lockedType;
  }

  if (!lines?.length) return null;

  const scores: Record<ParserType, number> = {
    DONATIONS: 0,
    DUEL_POINTS: 0,
    RR_RAID: 0,
    RR_ATTENDANCE: 0,
  };

  let bigNumbers = 0;
  let donationLike = 0;
  let noTeamCount = 0;
  let attendanceLike = 0;

  for (const line of lines) {
    const lower = line.toLowerCase();

    // =========================
    // 📊 GENERIC SIGNALS
    // =========================
    if (/\d{4,6}/.test(line)) bigNumbers++;

    if (/[a-z].*\d{4,6}/i.test(line)) {
      donationLike++;
    }

    // =========================
    // 💰 DONATIONS
    // =========================
    if (/donat|d0nat|donat1|e.?st.?ons/i.test(lower)) {
      scores.DONATIONS += 3;
    }

    if (/rank/i.test(lower)) {
      scores.DONATIONS += 1;
    }

    // =========================
    // ⚔️ DUEL
    // =========================
    if (/[\d]+[\.,]?\d*\s*[mk]/i.test(line) && !/donat/i.test(lower)) {
      scores.DUEL_POINTS += 2;
    }

    // =========================
    // 🏰 RR RAID
    // =========================
    if (/no\s*team/i.test(lower)) {
      noTeamCount++;
      scores.RR_RAID += 2;
    }

    if (
      lower.includes("main force") ||
      lower.includes("mainforce") ||
      lower.includes("reserve")
    ) {
      scores.RR_RAID += 2;
    }

    // =========================
    // 👥 RR ATTENDANCE
    // =========================
    if (/^\d+\s+[^\d]{2,}\s+\d{3,}/.test(line)) {
      attendanceLike++;
      scores.RR_ATTENDANCE += 2;
    }
  }

  // =========================
  // 📈 GLOBAL BOOSTS
  // =========================
  if (bigNumbers >= 5) scores.DONATIONS += 3;
  if (donationLike >= 3) scores.DONATIONS += 3;

  if (noTeamCount >= 2) scores.RR_RAID += 3;
  if (attendanceLike >= 3) scores.RR_ATTENDANCE += 3;

  // =========================
  // 🔥 ANTI-CONFLICT FIXES
  // =========================

  // jeśli donations ma słowa kluczowe → boost
  if (scores.DONATIONS > 0 && donationLike > 2) {
    scores.DONATIONS += 2;
  }

  // duel vs donations konflikt
  if (scores.DUEL_POINTS > 0 && scores.DONATIONS > 0) {
    if (donationLike > 2) {
      scores.DONATIONS += 2;
    } else {
      scores.DUEL_POINTS += 1;
    }
  }

  // =========================
  // 🧠 FINAL PICK
  // =========================
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  const [topType, topScore] = sorted[0];
  const secondScore = sorted[1]?.[1] ?? 0;

  log("SCORES:", scores);
  log("TOP:", topType, topScore, "| SECOND:", secondScore);

  // 🔥 minimal threshold
  if (topScore < 3) {
    log("❌ LOW CONFIDENCE");
    return null;
  }

  // 🔥 confidence gap (ważne)
  if (topScore - secondScore < 2) {
    log("⚠️ TYPE UNCERTAIN (gap too small)");
    return null;
  }

  log("✅ DETECTED:", topType);

  return topType as ParserType;
}