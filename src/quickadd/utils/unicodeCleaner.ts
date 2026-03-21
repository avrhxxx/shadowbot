// src/quickadd/utils/unicodeCleaner.ts
export function unicodeCleaner(input: string): string {
  return input
    .normalize("NFC")
    .trim()
    .replace(/\p{C}/gu, ""); // usuwa niewidoczne znaki Unicode
}