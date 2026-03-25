// =====================================
// 📁 src/quickadd/validation/QuickAddValidator.ts
// =====================================

/**
 * 🧠 ROLE:
 * Validates parsed entries (BATCH, evaluate-only).
 *
 * Responsible for:
 * - nickname resolution
 * - confidence scoring
 * - duplicate detection
 * - suggestions
 *
 * ❗ RULES:
 * - NO blocking (evaluate_only)
 * - BATCH processing
 * - FULL trace logging
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
// 🧠 PRIORITY
// =====================================

const statusPriority: Record<EntryStatus, number> = {
  INVALID_VALUE: 5,
  DUPLICATE: 4,
  UNRESOLVED: 3,
  LOW_CONFIDENCE: 2,
  OK: 1,
};

function pickHigherStatus(
  current: EntryStatus,
  next: EntryStatus
): EntryStatus {
  return statusPriority[next] > statusPriority[current]
    ? next
    : current;
}

// =====================================
// 🧠 MAIN VALIDATOR
// =====================================

export async function validateEntries(
  entries: { nickname: string; value: number }[],
  traceId: string
): Promise<ValidatedEntry[]> {
  const startedAt = Date.now();

  const results: ValidatedEntry[] = [];
  const seen = new Set<string>();

  let idCounter = 1;

  log.trace("validation_start", traceId, {
    entries: entries.length,
  });

  for (const entry of entries) {
    const originalNickname = entry.nickname;

    let confidence = 0;
    let status: EntryStatus = "OK";
    let suggestion: string | undefined;

    log.trace("entry_input", traceId, {
      nickname: entry.nickname,
      value: entry.value,
    });

    // =====================================
    // 🔢 VALUE VALIDATION
    // =====================================
    if (!entry.value || entry.value <= 0) {
      status = pickHigherStatus(status, "INVALID_VALUE");
      confidence = 0;

      log.trace("decision_invalid_value", traceId, {
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

      log.trace("resolve_result", traceId, {
        input: entry.nickname,
        resolved,
      });

    } catch (err) {
      log.warn("resolve_failed", traceId, {
        error: err,
      });
    }

    const wasMapped = resolved && resolved !== entry.nickname;

    // =====================================
    // 🧠 CONFIDENCE + STATUS
    // =====================================
    if (!wasMapped) {
      status = pickHigherStatus(status, "UNRESOLVED");
      confidence = Math.min(confidence || 1, 0.3);

      log.trace("decision_unresolved", traceId, {
        nickname: entry.nickname,
      });

      if (
        entry.nickname.length < 4 ||
        /donations|total|points/i.test(entry.nickname)
      ) {
        confidence = Math.min(confidence, 0.1);

        log.trace("decision_low_quality_ocr", traceId, {
          nickname: entry.nickname,
        });
      }

    } else {
      const similarity = stringSimilarity(entry.nickname, resolved);

      confidence = similarity;

      log.trace("similarity_computed", traceId, {
        input: entry.nickname,
        resolved,
        similarity,
      });

      if (similarity >= 0.9) {
        status = pickHigherStatus(status, "OK");

      } else if (similarity >= 0.7) {
        status = pickHigherStatus(status, "LOW_CONFIDENCE");
        suggestion = resolved;

      } else {
        status = pickHigherStatus(status, "UNRESOLVED");
        suggestion = resolved;
      }
    }

    // =====================================
    // 🔁 DUPLICATE DETECTION
    // =====================================
    const key = `${entry.nickname}:${entry.value}`;

    if (seen.has(key)) {
      status = pickHigherStatus(status, "DUPLICATE");
      confidence = Math.min(confidence, 0.5);

      log.trace("decision_duplicate", traceId, {
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

    log.trace("entry_output", traceId, {
      id: validated.id,
      nickname: validated.nickname,
      status: validated.status,
      confidence: validated.confidence,
      suggestion: validated.suggestion,
    });
  }

  log.trace("validation_done", traceId, {
    total: results.length,
    durationMs: Date.now() - startedAt,
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