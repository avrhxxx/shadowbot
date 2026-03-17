// src/modules/quickadd/preview/DuplicateDetector.ts

import { QuickAddEntry } from "../types/QuickAddEntry";
import { normalizeNickname } from "../utils/nicknameNormalizer";

/**
 * Wykrywa duplikaty na podstawie znormalizowanego nickname
 */
export function detectDuplicates(entries: QuickAddEntry[]): QuickAddEntry[] {
  const seen = new Map<string, number>();

  return entries.map((entry) => {
    const normalized = normalizeNickname(entry.nickname);

    if (seen.has(normalized)) {
      return {
        ...entry,
        status: "DUPLICATE",
      };
    }

    seen.set(normalized, 1);
    return entry;
  });
}