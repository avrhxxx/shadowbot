/**
 * DuplicateDetector.ts
 *
 * Wykrywa duplikaty w buforze QuickAddEntry
 */

import { QuickAddEntry } from "../types/QuickAddEntry";

export class DuplicateDetector {
  /**
   * Oznacza wpisy duplikatami w oparciu o znormalizowany nickname
   */
  static markDuplicates(entries: QuickAddEntry[]): QuickAddEntry[] {
    const seen = new Map<string, QuickAddEntry>();
    
    return entries.map(entry => {
      const key = entry.nickname.toLowerCase().trim(); // prosta normalizacja
      if (seen.has(key)) {
        return { ...entry, status: "DUPLICATE" };
      } else {
        seen.set(key, entry);
        return { ...entry, status: entry.status || "OK" };
      }
    });
  }

  /**
   * Sprawdza, czy w buforze są duplikaty
   */
  static hasDuplicates(entries: QuickAddEntry[]): boolean {
    const keys = new Set<string>();
    return entries.some(entry => {
      const key = entry.nickname.toLowerCase().trim();
      if (keys.has(key)) return true;
      keys.add(key);
      return false;
    });
  }
}