// src/quickadd/parsing/index.ts

import { ParsedEntry, QuickAddType } from "../core/QuickAddTypes";

export function parseByType(
  type: QuickAddType,
  lines: string[]
): ParsedEntry[] {
  switch (type) {
    case "DONATIONS":
      return [];
    case "DUEL_POINTS":
      return [];
    case "RR_ATTENDANCE":
      return [];
    case "RR_RAID":
      return [];
    default:
      return [];
  }
}