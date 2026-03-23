// =====================================
// 📁 src/quickadd/parsing/index.ts
// =====================================

import { QuickAddType } from "../core/QuickAddTypes";
import { parseDonations } from "./donations/DonationsParser";

export function parseByType(
  type: QuickAddType | null,
  lines: string[],
  traceId: string
) {
  if (!type) {
    return [];
  }

  switch (type) {
    case "DONATIONS":
      return parseDonations(lines, traceId);

    // 🔥 PLACEHOLDERS (future ready)
    case "DUEL_POINTS":
    case "RR_ATTENDANCE":
    case "RR_RAID":
      return [];

    default:
      return [];
  }
}