// src/quickadd/detector/ImageTypeDetector.ts
import { ParserType } from "../session/SessionManager";

export function detectImageType(
  lines: string[],
  lockedType?: ParserType | null
): ParserType | null {
  console.log("=================================");
  console.log("🧠 DETECTOR START (V4)");
  console.log("=================================");

  // 🔒 LOCK
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

  let strongRaid = false;
  let strongAttendance = false;

  for (const line of lines) {
    const lower = line.toLowerCase();

    // =========================
    // 🏹 STRONG RAID
    // =========================
    if (lower.includes("no team")) {
      strongRaid = true;
      scores.RR_RAID += 5;
    }

    if (lower.includes("raid score")) {
      strongRaid = true;
      scores.RR_RAID += 5;
    }

    // =========================
    // 📅 STRONG ATTEND
    // =========================
    if (lower.includes("attend")) {
      strongAttendance = true;
      scores.RR_ATTENDANCE += 5;
    }

    // =========================
    // 💰 DONATIONS
    // =========================
    if (lower.includes("donations")) {
      scores.DONATIONS += 5;
    }

    if (/donat|ionat|dona|tion/i.test(line)) {
      scores.DONATIONS += 2;
    }

    if (lower.includes("ranking rewards")) {
      scores.DONATIONS += 2;
    }

    // =========================
    // ⚔️ DUEL (LEPSZY)
    // =========================
    if (/[\d]+[\.,]?\d*\s*[mk]/i.test(line)) {
      scores.DUEL_POINTS += 3;
    }

    // 🔥 tylko jeśli nie wygląda jak donations
    if (lower.includes("points") && !lower.includes("donat")) {
      scores.DUEL_POINTS += 2;
    }

    // =========================
    // RAID LIGHT
    // =========================
    if (lower.includes("guild")) {
      scores.RR_RAID += 1;
    }

    // =========================
    // ATTEND LIGHT
    // =========================
    if (lower.includes("present")) {
      scores.RR_ATTENDANCE += 1;
    }

    // =========================
    // NUMBERS (LOW WEIGHT)
    // =========================
    if (/\d{4,}/.test(line)) {
      scores.DONATIONS += 0.2;
    }
  }

  console.log("📊 SCORES:", scores);

  // 🔥 STRONG OVERRIDE
  if (strongRaid) {
    console.log("🔥 STRONG RAID DETECTED");
    return "RR_RAID";
  }

  if (strongAttendance) {
    console.log("🔥 STRONG ATTENDANCE DETECTED");
    return "RR_ATTENDANCE";
  }

  // =========================
  // 🧠 SORT
  // =========================
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  const [topType, topScore] = sorted[0];
  const secondScore = sorted[1]?.[1] ?? 0;

  // =========================
  // ❌ TOO LOW
  // =========================
  if (topScore < 3) {
    console.log("❌ Score too low");
    return null;
  }

  // =========================
  // 🔥 TIE BREAKER (FIX)
  // =========================
  const diff = topScore - secondScore;

  if (diff < 1) {
    console.log("⚠️ Weak difference, applying fallback logic");

    // 🔥 prefer duel over donations if M/K present
    if (scores.DUEL_POINTS >= scores.DONATIONS) {
      console.log("🧠 Tie → DUEL_POINTS");
      return "DUEL_POINTS";
    }

    console.log("🧠 Tie → DONATIONS");
    return "DONATIONS";
  }

  console.log(`✅ DETECTED: ${topType}`);
  return topType as ParserType;
}