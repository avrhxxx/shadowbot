// =====================================
// 📁 src/system/quickadd/validation/QuickAddValidator.ts
// =====================================

import { log } from "../../core/logger/log";
import { resolveNickname } from "../mapping/NicknameResolver";

import {
  ParsedEntry,
  ValidatedEntry,
  EntryStatus,
} from "../core/QuickAddTypes";
import { TraceContext } from "../../core/trace/TraceContext";

// =====================================
// 🧠 HELPERS
// =====================================

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
  ctx: TraceContext
): Promise<ValidatedEntry[]> {
  const l = log.ctx(ctx);
  const startedAt = Date.now();

  const results: ValidatedEntry[] = [];
  const seen = new Set<string>();

  let idCounter = 1;

  l.event("validation_start", {
    entries: entries.length,
  });

  for (const entry of entries) {
    l.event("validation_entry_start", {
      nickname: entry.nickname,
      value: entry.value,
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

      l.event("decision_invalid_value", {
        value: entry.value,
      });
    }

    // =====================================
    // 🧠 RESOLVE NICKNAME
    // =====================================
    let resolved = "";

    try {
      resolved = await resolveNickname(entry.nickname, ctx);

      l.event("resolve_result", {
        input: entry.nickname,
        resolved,
      });
    } catch (err) {
      l.warn("resolve_failed", {
        input: entry.nickname,
        error: err,
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

        l.event("decision_unresolved", {
          nickname: entry.nickname,
        });

        if (
          entry.nickname.length < 4 ||
          /donations|total|points/i.test(entry.nickname)
        ) {
          confidence = 0.1;

          l.event("decision_low_quality_ocr", {
            nickname: entry.nickname,
          });
        }
      } else {
        const similarity = stringSimilarity(entry.nickname, resolved);
        confidence = similarity;

        l.event("similarity_computed", {
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
    }

    // =====================================
    // 🔁 DUPLICATE DETECTION
    // =====================================
    const key = `${normalize(finalNickname)}:${entry.value}`;

    if (seen.has(key)) {
      status = pickHigherStatus(status, "DUPLICATE");
      confidence = Math.min(confidence, 0.5);

      l.event("decision_duplicate", {
        key,
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

    l.event("validation_entry_done", {
      id: validated.id,
      nickname: validated.nickname,
      status: validated.status,
      confidence: validated.confidence,
      suggestion: validated.suggestion,
    });
  }

  l.event("validation_done", {}, {
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