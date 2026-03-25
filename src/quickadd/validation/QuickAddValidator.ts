// =====================================
// 📁 src/quickadd/validation/QuickAddValidator.ts
// =====================================

/**
 * 🧠 ROLE:
 * Validates parsed entries and enriches them with:
 * - nickname resolution (mapping)
 * - confidence scoring
 * - duplicate detection
 * - suggestions
 *
 * Pipeline stage:
 * parser → validation → buffer
 *
 * ❗ RULES:
 * - may use async (mapping)
 * - contains "intelligence layer"
 * - no OCR / parsing logic here
 */

import { createLogger } from "../debug/DebugLogger";
import { resolveNickname } from "../mapping/NicknameResolver";

const log = createLogger("VALIDATION");

// =====================================
// 🧱 TYPES
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

  // =====================================
  // 🚀 INPUT
  // =====================================
  log.trace("validation_start", {
    entries: entries.length,
  });

  for (const entry of entries) {
    const originalNickname = entry.nickname;

    let confidence = 0;
    let status: EntryStatus = "OK";
    let suggestion: string | undefined;

    // =====================================
    // 📥 ENTRY INPUT
    // =====================================
    log.trace("entry_input", {
      nickname: entry.nickname,
      value: entry.value,
    });

    // =====================================
    // 🔢 VALUE VALIDATION
    // =====================================
    if (!entry.value || entry.value <= 0) {
      status = "INVALID_VALUE";
      confidence = 0;

      log.trace("decision_invalid_value", {
        nickname: entry.nickname,
        value: entry.value,
      });
    }

    // =====================================
    // 🧠 RESOLVE NICKNAME
    // =====================================
    let resolved = "";
    try {
      resolved = await resolveNickname(entry.nickname);

      log.trace("resolve_result", {
        input: entry.nickname,
        resolved,
      });

    } catch (err) {
      log.warn("resolve_failed", err);
    }

    const wasMapped = resolved && resolved !== entry.nickname;

    // =====================================
    // 🧠 CONFIDENCE + STATUS
    // =====================================
    if (!wasMapped) {
      status = "UNRESOLVED";
      confidence = 0.3;

      log.trace("decision_unresolved", {
        nickname: entry.nickname,
      });

      // 🔥 OCR garbage detection
      if (
        entry.nickname.length < 4 ||
        /donations|total|points/i.test(entry.nickname)
      ) {
        confidence = 0.1;

        log.trace("decision_low_quality_ocr", {
          nickname: entry.nickname,
        });
      }

    } else {
      const similarity = stringSimilarity(entry.nickname, resolved);

      confidence = similarity;

      log.trace("similarity_computed", {
        input: entry.nickname,
        resolved,
        similarity,
      });

      if (similarity >= 0.9) {
        status = "OK";

        log.trace("decision_high_confidence", {
          similarity,
        });

      } else if (similarity >= 0.7) {
        status = "LOW_CONFIDENCE";
        suggestion = resolved;

        log.trace("decision_low_confidence", {
          similarity,
          suggestion,
        });

      } else {
        status = "UNRESOLVED";
        suggestion = resolved;

        log.trace("decision_unresolved_with_suggestion", {
          similarity,
          suggestion,
        });
      }
    }

    // =====================================
    // 🔁 DUPLICATE DETECTION
    // =====================================
    const key = `${entry.nickname}:${entry.value}`;

    if (seen.has(key)) {
      status = "DUPLICATE";
      confidence = Math.min(confidence, 0.5);

      log.trace("decision_duplicate", {
        key,
      });

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

    // =====================================
    // 📤 ENTRY OUTPUT
    // =====================================
    log.trace("entry_output", {
      id: validated.id,
      nickname: validated.nickname,
      status: validated.status,
      confidence: validated.confidence,
      suggestion: validated.suggestion,
    });
  }

  // =====================================
  // ✅ FINAL OUTPUT
  // =====================================
  log.trace("validation_done", {
    total: results.length,
  });

  return results;
}

// =====================================
// 🔤 STRING SIMILARITY
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