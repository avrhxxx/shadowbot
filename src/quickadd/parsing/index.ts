// =====================================
// 📁 src/quickadd/parsing/index.ts
// =====================================

import { QuickAddType } from "../core/QuickAddTypes";
import { parseDonations } from "./donations/DonationsParser";

export function parseByType(
  type: QuickAddType,
  lines: string[],
  traceId: string
) {
  switch (type) {
    case "DONATIONS_POINTS":
      return parseDonations(lines, traceId);

    // 🔥 PLACEHOLDERS (future ready)
    case "DUEL_POINTS":
    case "RR_SIGNUPS":
    case "RR_RESULTS":
      return [];

    default:
      return [];
  }
}