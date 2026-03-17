// src/modules/quickadd/utils/nicknameNormalizer.ts

import { cleanUnicode } from "./unicodeCleaner";

/**
 * Normalizuje nickname do porównań (aliasy, duplikaty)
 * NIE zmienia oryginalnego nicku do wyświetlania
 */
export function normalizeNickname(input: string): string {
  return cleanUnicode(input)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ""); // usuwa spacje całkowicie (Run Sawyer → runsawyer)
}