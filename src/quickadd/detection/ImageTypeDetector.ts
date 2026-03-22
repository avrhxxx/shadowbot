// src/quickadd/detection/ImageTypeDetector.ts

import { QuickAddType } from "../core/QuickAddTypes";

export function detectImageType(
  lines: string[]
): QuickAddType | null {
  const text = lines.join(" ").toLowerCase();

  if (text.includes("donation")) return "DONATIONS";
  if (text.includes("duel")) return "DUEL_POINTS";

  return null;
}