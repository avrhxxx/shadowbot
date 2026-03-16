/**
 * nicknameNormalizer.ts
 * 
 * Helper do normalizacji nicków graczy.
 */

import { cleanUnicode } from "./unicodeCleaner";

/**
 * Normalizuje nickname do formy porównawczej.
 * Kroki:
 * 1. lowercase
 * 2. trim whitespace
 * 3. usuwa niewidoczne znaki Unicode
 * 4. zamienia wiele spacji na jedną
 */
export function normalizeNickname(nick: string): string {
  const cleaned = cleanUnicode(nick);
  return cleaned
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}