export type ParserType =
  | "RR_RAID"
  | "RR_ATTENDANCE"
  | "DONATIONS"
  | "DUEL_POINTS"
  | "UNKNOWN";

export function detectParserType(lines: string[]): ParserType {
  if (!lines || lines.length === 0) return "UNKNOWN";

  const text = lines.join(" ").toLowerCase();

  // 🔥 anty-crash
  if (lines.length > 200) return "UNKNOWN";

  // =========================
  // 🟣 DONATIONS
  // =========================
  if (text.includes("donation")) {
    return "DONATIONS";
  }

  // =========================
  // 🔵 DUEL
  // =========================
  if (
    text.includes("rank") &&
    text.includes("player") &&
    text.includes("points") &&
    text.match(/\d+\.\d+M/)
  ) {
    return "DUEL_POINTS";
  }

  // =========================
  // 🟢 RAID
  // =========================
  if (
    text.includes("no team") &&
    text.includes("raid score")
  ) {
    return "RR_RAID";
  }

  // =========================
  // 🟡 ATTENDANCE
  // =========================
  if (
    !text.includes("donation") &&
    !text.includes("raid score") &&
    text.match(/\d{1,2}\s+[^\d]+\s+\d{2,}/)
  ) {
    return "RR_ATTENDANCE";
  }

  return "UNKNOWN";
}