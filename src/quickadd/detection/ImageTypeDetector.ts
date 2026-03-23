// =====================================
// 📁 src/quickadd/detection/ImageTypeDetector.ts
// =====================================

import { QuickAddType } from "../core/QuickAddTypes";

export function detectImageType(
  lines: string[]
): QuickAddType | null {
  const text = lines.join(" ").toLowerCase();

  // =============================
  // 💰 DONATIONS
  // =============================
  if (text.includes("donation")) {
    return "DONATIONS";
  }

  // =============================
  // ⚔️ DUEL
  // =============================
  if (text.includes("duel")) {
    return "DUEL_POINTS";
  }

  // =============================
  // 🏰 RESERVOIR RAID (PLACEHOLDER)
  // =============================
  if (
    text.includes("reservoir raid") ||
    text.includes("rr raid")
  ) {
    return "RR_RAID";
  }

  // =============================
  // 📋 RESERVOIR ATTENDANCE (PLACEHOLDER)
  // =============================
  if (
    text.includes("attendance") ||
    text.includes("attendence") || // OCR typo
    text.includes("rr attendance")
  ) {
    return "RR_ATTENDANCE";
  }

  return null;
}