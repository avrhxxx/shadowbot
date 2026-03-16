// src/modules/quickadd/utils/unicodeCleaner.ts
/**
 * Funkcja usuwa niewidzialne znaki Unicode z tekstu
 * np. zero-width space, non-breaking space, itp.
 */
export function cleanUnicode(input: string): string {
  return input.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
}