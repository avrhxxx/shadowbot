// =====================================
// 📁 src/quickadd/parsing/index.ts
// =====================================

import { parseDonations } from "./donations/DonationsParser";

export function parseOCR(lines: string[], traceId: string) {
  // 🔥 NA RAZIE: na sztywno donations
  return parseDonations(lines, traceId);
}