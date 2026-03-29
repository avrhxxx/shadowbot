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
 * - traceId REQUIRED (STRICT)
 */

import { logger } from "../../core/logger/log";
import { resolveNickname } from "../mapping/NicknameResolver";

import {
  ParsedEntry,
  ValidatedEntry,
  EntryStatus,
} from "../core/QuickAddTypes";

// =====================================
// 🧠 HELPERS
// =====================================

function assertTrace(traceId: string) {
  if (!traceId) {
    throw new Error("[VALIDATOR ERROR] Missing traceId");
  }
}

function normalize(str: string): string {
  return str.trim().toLowerCase();
}

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
  entries: ParsedEntry[],
  traceId: string
): Promise<ValidatedEntry[]> {
  assertTrace(traceId);

  const startedAt = Date.now();

  const results: ValidatedEntry[] = [];
  const seen = new Set<string>();

  let idCounter = 1;

  logger.emit({
    scope: "quickadd.validator",
    event: "validation_start",
    traceId,
    context: { entries: entries.length },
  });

  for (const entry of entries) {
    logger.emit({
      scope: "quickadd.validator",
      event: "validation_entry_start",
      traceId,
      context: {
        nickname: entry.nickname,
        value: entry.value,
      },
    });

    const originalNickname = entry.nickname;

    let confidence = 0;
    let status: EntryStatus = "OK";
    let suggestion: string | undefined;

    let isInvalidValue = false;

    // =====================================
    // 🔢 VALUE VALIDATION
    // =====================================
    if (!entry.value || entry.value <= 0) {
      status = pickHigherStatus(status, "INVALID_VALUE");
      confidence = 0;
      isInvalidValue = true;

      logger.emit({
        scope: "quickadd.validator",
        event: "decision_invalid_value",
        traceId,
        context: { value: entry.value },
      });
    }

    // =====================================
    // 🧠 RESOLVE NICKNAME
    // =====================================
    let resolved = "";

    try {
      resolved = await resolveNickname(entry.nickname, traceId);

      logger.emit({
        scope: "quickadd.validator",
        event: "resolve_result",
        traceId,
        context: {
          input: entry.nickname,
          resolved,
        },
      });
    } catch (err) {
      logger.emit({
        scope: "quickadd.validator",
        event: "resolve_failed",
        traceId,
        level: "warn",
        error: err,
        context: {
          input: entry.nickname,
        },
      });
    }

    const finalNickname = resolved || entry.nickname;
    const wasMapped = resolved && resolved !== entry.nickname;

    // =====================================
    // 🧠 CONFIDENCE + STATUS
    // =====================================
    if (!isInvalidValue) {
      if (!wasMapped) {
        status = pickHigherStatus(status, "UNRESOLVED");
        confidence = 0.3;

        logger.emit({
          scope: "quickadd.validator",
          event: "decision_unresolved",
          traceId,
          context: { nickname: entry.nickname },
        });

        if (
          entry.nickname.length < 4 ||
          /donations|total|points/i.test(entry.nickname)
        ) {
          confidence = 0.1;

          logger.emit({
            scope: "quickadd.validator",
            event: "decision_low_quality_ocr",
            traceId,
            context: { nickname: entry.nickname },
          });
        }
      } else {
        const similarity = stringSimilarity(entry.nickname, resolved);
        confidence = similarity;

        logger.emit({
          scope: "quickadd.validator",
          event: "similarity_computed",
          traceId,
          context: {
            input: entry.nickname,
            resolved,
            similarity,
          },
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
    }

    // =====================================
    // 🔁 DUPLICATE DETECTION
    // =====================================
    const key = `${normalize(finalNickname)}:${entry.value}`;

    if (seen.has(key)) {
      status = pickHigherStatus(status, "DUPLICATE");
      confidence = Math.min(confidence, 0.5);

      logger.emit({
        scope: "quickadd.validator",
        event: "decision_duplicate",
        traceId,
        context: { key },
      });
    } else {
      seen.add(key);
    }

    const validated: ValidatedEntry = {
      id: idCounter++,
      nickname: finalNickname,
      value: entry.value,
      originalNickname,
      status,
      confidence,
      suggestion,
    };

    results.push(validated);

    logger.emit({
      scope: "quickadd.validator",
      event: "validation_entry_done",
      traceId,
      context: {
        id: validated.id,
        nickname: validated.nickname,
        status: validated.status,
        confidence: validated.confidence,
        suggestion: validated.suggestion,
      },
    });
  }

  logger.emit({
    scope: "quickadd.validator",
    event: "validation_done",
    traceId,
    stats: {
      total: results.length,
      durationMs: Date.now() - startedAt,
    },
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