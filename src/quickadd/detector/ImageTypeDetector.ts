
// src/quickadd/detector/ImageTypeDetector.ts
import { ParserType } from "../session/SessionManager";

// =====================================
// 🔍 IMAGE TYPE DETECTOR (V3 - FIXED REAL DATA)
// =====================================
export function detectImageType(
  lines: string[],
  lockedType?: ParserType | null
): ParserType | null {
  console.log("=================================");
  console.log("🧠 DETECTOR START (V3)");
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
    // 💰 DONATIONS (STRONG SIGNAL)
    // =========================
    if (lower.includes("donations")) {
      scores.DONATIONS += 5; // 🔥 mocny sygnał
    }

    // OCR błędy
    if (/donat|ionat|dona|tion/i.test(line)) {
      scores.DONATIONS += 2;
    }

    // "Ranking rewards" → też donations screen
    if (lower.includes("ranking rewards")) {
      scores.DONATIONS += 2;
    }

    // =========================
    // ⚔️ DUEL POINTS
    // =========================
    if (/[\d]+[\.,]?\d*\s*[mk]/i.test(line)) {
      scores.DUEL_POINTS += 3;
    }

    if (lower.includes("points")) {
      scores.DUEL_POINTS += 1;
    }

    // =========================
    // 🏹 RAID
    // =========================
    if (lower.includes("no team")) {
      scores.RR_RAID += 4;
    }

    if (lower.includes("raid score")) {
      scores.RR_RAID += 4;
    }

    if (lower.includes("guild")) {
      scores.RR_RAID += 1;
    }

    // =========================
    // 📅 ATTENDANCE
    // =========================
    if (lower.includes("attend")) {
      scores.RR_ATTENDANCE += 4;
    }

    if (lower.includes("present")) {
      scores.RR_ATTENDANCE += 1;
    }

    // =========================
    // ❌ NUMBERS → MINIMAL IMPACT
    // =========================
    if (/\d{4,}/.test(line)) {
      // tylko lekki hint, nie decyduje
      scores.DONATIONS += 0.2;
    }
  }

  console.log("📊 SCORES:", scores);

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [type, score] = sorted[0];

  // 🔥 próg wyższy, żeby uniknąć false positive
  if (score < 3) {
    console.log("❌ Score too low");
    return null;
  }

  if (sorted[1] && sorted[1][1] === score) {
    console.log("⚠️ Tie → null");
    return null;
  }

  console.log(`✅ DETECTED: ${type}`);
  return type as ParserType;
}}