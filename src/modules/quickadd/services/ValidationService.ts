// src/modules/quickadd/services/ValidationService.ts

import { QuickAddEntry } from "../types/QuickAddEntry";
import { parseNumber } from "../utils/numberParser";

/**
 * Waliduje wpisy QuickAdd
 */
export function validateEntries(entries: QuickAddEntry[]): QuickAddEntry[] {
  return entries.map((entry) => {
    const parsed = parseNumber(entry.value);

    if (!entry.nickname || entry.nickname.length < 2) {
      return { ...entry, status: "INVALID" };
    }

    if (parsed === null) {
      return { ...entry, status: "INVALID" };
    }

    return entry;
  });
}