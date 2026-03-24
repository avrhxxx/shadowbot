// =====================================
// 📁 src/quickadd/validation/QuickAddValidator.ts
// =====================================

import { createLogger } from "../debug/DebugLogger";
import { resolveNickname } from "../mapping/NicknameResolver";

const log = createLogger("VALIDATION");

// =====================================
// 🧠 TYPES
// =====================================

export type EntryStatus =
  | "OK"
  | "LOW_CONFIDENCE"
  | "UNRESOLVED"
  | "DUPLICATE"
  | "INVALID_VALUE";

export type ValidatedEntry = {
  id: number;

  nickname: string;
  value: number;

  originalNickname: string;

  status: EntryStatus;
  confidence: number;

  suggestion?: string;
};

// =====================================
// 🧠 MAIN VALIDATOR
// =====================================

export async function validateEntries(
  entries: { nickname: string; value: number }[]
): Promise<ValidatedEntry[]> {
  const results: ValidatedEntry[] = [];

  const seen = new Set<string>();
  let idCounter = 1;

  for (const entry of entries) {
    const originalNickname = entry.nickname;

    let confidence = 0;
    let status: EntryStatus = "OK";
    let suggestion: string | undefined;

    // =============================
    // 🔢 VALUE VALIDATION
    // =============================
    if (!entry.value || entry.value <= 0) {
      status = "INVALID_VALUE";
      confidence = 0;
    }

    // =============================
    // 🧠 RESOLVE NICKNAME
    // =============================
    let resolved = "";
    try {
      resolved = await resolveNickname(entry.nickname);
    } catch (err) {
      log.warn("resolve_failed", err);
    }

    // 🔥 KLUCZOWE — czy mapping faktycznie zaszedł
    const wasMapped = resolved && resolved !== entry.nickname;

    // =============================
    // 🧠 CONFIDENCE + STATUS
    // =============================
    if (!wasMapped) {
      // 🔥 brak mapowania = NIE OK
      status = "UNRESOLVED";
      confidence = 0.3;

      // 🔥 heurystyka śmieci OCR
      if (
        entry.nickname.length < 4 ||
        /donations|total|points/i.test(entry.nickname)
      ) {
        confidence = 0.1;
      }
    } else {
      const similarity = stringSimilarity(entry.nickname, resolved);

      confidence = similarity;

      if (similarity >= 0.9) {
        status = "OK";
      } else if (similarity >= 0.7) {
        status = "LOW_CONFIDENCE";
        suggestion = resolved;
      } else {
        status = "UNRESOLVED";
        suggestion = resolved;
      }
    }

    // =============================
    // 🔁 DUPLICATE DETECTION
    // =============================
    const key = `${entry.nickname}:${entry.value}`;

    if (seen.has(key)) {
      status = "DUPLICATE";
      confidence = Math.min(confidence, 0.5);
    } else {
      seen.add(key);
    }

    const validated: ValidatedEntry = {
      id: idCounter++,
      nickname: entry.nickname,
      value: entry.value,
      originalNickname,
      status,
      confidence,
      suggestion,
    };

    results.push(validated);

    log("validated_entry", validated);
  }

  return results;
}

// =====================================
// 🔤 STRING SIMILARITY (SAFE)
// =====================================
function stringSimilarity(a: string, b: string): number {
  const distance = levenshtein(a.toLowerCase(), b.toLowerCase());
  const maxLen = Math.max(a.length, b.length);

  return maxLen > 0 ? 1 - distance / maxLen : 0;
}

// =====================================
// 🔤 LEVENSHTEIN
// =====================================
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];

  const aLen = a.length;
  const bLen = b.length;

  for (let i = 0; i <= bLen; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= aLen; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bLen; i++) {
    for (let j = 1; j <= aLen; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[bLen][aLen];
}