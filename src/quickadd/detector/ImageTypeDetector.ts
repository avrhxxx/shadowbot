// src/quickadd/detector/ImageTypeDetector.ts
import { ParserType } from "../session/SessionManager";

// =====================================
// 🔍 IMAGE TYPE DETECTOR (V2 - STICKY)
// =====================================
export function detectImageType(
  lines: string[],
  lockedType?: ParserType | null
): ParserType | null {
  console.log("=================================");
  console.log("🧠 DETECTOR START");
  console.log("=================================");

  // 🔒 MULTISCREEN FIX
  if (lockedType) {
    console.log("🔒 Using locked parser:", lockedType);
    return lockedType;
  }

  if (!lines || lines.length === 0) {
    console.log("❌ No lines provided");
    return null;
  }

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
    // ⚔️ DUEL
    // =========================
    if (/[\d]+[\.,]?\d*\s*[mk]/i.test(line)) {
      scores.DUEL_POINTS += 2;
    }

    // =========================
    // RAID
    // =========================
    if (/no\s*team/i.test(lower)) {
      scores.RR_RAID += 2;
    }

    if (lower.includes("main force")) {
      scores.RR_RAID += 1;
    }

    if (lower.includes("reserve")) {
      scores.RR_RAID += 1;
    }

    // =========================
    // ATTEND
    // =========================
    if (lower.includes("attend")) {
      scores.RR_ATTENDANCE += 2;
    }
  }

  console.log("📊 SCORES:", scores);

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [type, score] = sorted[0];

  if (score < 2) {
    console.log("❌ Score too low");
    return null;
  }

  if (sorted[1] && sorted[1][1] === score) {
    console.log("⚠️ Tie → null");
    return null;
  }

  console.log(`✅ DETECTED: ${type}`);
  return type as ParserType;
}