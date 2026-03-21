// src/quickadd/detector/ImageTypeDetector.ts
import { ParserType } from "../session/SessionManager";

export function detectImageType(
  lines: string[],
  lockedType?: ParserType | null
): ParserType | null {
  console.log("=================================");
  console.log("🧠 DETECTOR START (V5 DEBUG)");
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

  console.log("📄 INPUT LINES:");
  lines.forEach((l, i) => {
    console.log(`[${i}] "${l}"`);
  });

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

    console.log("🔍 ANALYZE:", line);

    // =========================
    // 🏹 STRONG RAID
    // =========================
    if (lower.includes("no team")) {
      strongRaid = true;
      scores.RR_RAID += 5;
      console.log("   ➕ RAID +5 (no team)");
    }

    if (lower.includes("raid score")) {
      strongRaid = true;
      scores.RR_RAID += 5;
      console.log("   ➕ RAID +5 (raid score)");
    }

    // =========================
    // 📅 STRONG ATTEND
    // =========================
    if (lower.includes("attend")) {
      strongAttendance = true;
      scores.RR_ATTENDANCE += 5;
      console.log("   ➕ ATTEND +5 (attend)");
    }

    // =========================
    // 💰 DONATIONS
    // =========================
    if (lower.includes("donations")) {
      scores.DONATIONS += 5;
      console.log("   ➕ DONATIONS +5 (keyword)");
    }

    if (/donat|ionat|dona|tion/i.test(line)) {
      scores.DONATIONS += 2;
      console.log("   ➕ DONATIONS +2 (fuzzy)");
    }

    if (lower.includes("ranking rewards")) {
      scores.DONATIONS += 2;
      console.log("   ➕ DONATIONS +2 (ranking rewards)");
    }

    // =========================
    // ⚔️ DUEL
    // =========================
    if (/[\d]+[\.,]?\d*\s*[mk]/i.test(line)) {
      scores.DUEL_POINTS += 3;
      console.log("   ➕ DUEL +3 (K/M pattern)");
    }

    if (lower.includes("points") && !lower.includes("donat")) {
      scores.DUEL_POINTS += 2;
      console.log("   ➕ DUEL +2 (points)");
    }

    // =========================
    // RAID LIGHT
    // =========================
    if (lower.includes("guild")) {
      scores.RR_RAID += 1;
      console.log("   ➕ RAID +1 (guild)");
    }

    // =========================
    // ATTEND LIGHT
    // =========================
    if (lower.includes("present")) {
      scores.RR_ATTENDANCE += 1;
      console.log("   ➕ ATTEND +1 (present)");
    }

    // =========================
    // NUMBERS
    // =========================
    if (/\d{4,}/.test(line)) {
      scores.DONATIONS += 0.2;
      console.log("   ➕ DONATIONS +0.2 (big number)");
    }
  }

  console.log("=================================");
  console.log("📊 FINAL SCORES:", scores);
  console.log("=================================");

  // 🔥 STRONG OVERRIDE
  if (strongRaid) {
    console.log("🔥 STRONG RAID DETECTED → FORCE RR_RAID");
    return "RR_RAID";
  }

  if (strongAttendance) {
    console.log("🔥 STRONG ATTEND DETECTED → FORCE RR_ATTENDANCE");
    return "RR_ATTENDANCE";
  }

  // =========================
  // 🧠 SORT
  // =========================
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  console.log("📊 SORTED:", sorted);

  const [topType, topScore] = sorted[0];
  const secondScore = sorted[1]?.[1] ?? 0;

  console.log("🥇 TOP:", topType, topScore);
  console.log("🥈 SECOND:", secondScore);

  // =========================
  // ❌ TOO LOW
  // =========================
  if (topScore < 3) {
    console.log("❌ Score too low → NULL");
    return null;
  }

  // =========================
  // 🔥 TIE BREAKER
  // =========================
  const diff = topScore - secondScore;

  console.log("⚖️ DIFF:", diff);

  if (diff < 1) {
    console.log("⚠️ Weak difference → fallback logic");

    if (scores.DUEL_POINTS >= scores.DONATIONS) {
      console.log("🧠 Tie → DUEL_POINTS");
      return "DUEL_POINTS";
    }

    console.log("🧠 Tie → DONATIONS");
    return "DONATIONS";
  }

  console.log(`✅ FINAL DETECTED: ${topType}`);
  return topType as ParserType;
}