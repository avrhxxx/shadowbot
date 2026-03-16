/**
 * unicodeCleaner.ts
 * 
 * Helper do czyszczenia niewidocznych znaków Unicode w nickach.
 */

export function cleanUnicode(input: string): string {
  // Usuwa znaki niewidoczne i kontrolne
  return input.replace(/[\u200B-\u200D\uFEFF]/g, "");
}