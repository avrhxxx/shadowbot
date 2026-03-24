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

    let confidence = 0.3;
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

    const cleanedInput = clean(entry.nickname);
    const cleanedResolved = clean(resolved);

    // =============================
    // 🧠 CONFIDENCE + SUGGESTION
    // =============================
    if (cleanedInput === cleanedResolved && resolved) {
      confidence = 1.0;
    } else if (resolved) {
      confidence = 0.75;
      suggestion = resolved;
    } else {
      confidence = 0.3;
    }

    // =============================
    // ❌ UNRESOLVED
    // =============================
    if (!resolved || !cleanedResolved) {
      status = "UNRESOLVED";
    }

    // =============================
    // ⚠️ LOW CONFIDENCE
    // =============================
    else if (confidence < 0.8 && status === "OK") {
      status = "LOW_CONFIDENCE";
    }

    // =============================
    // 🔁 DUPLICATE DETECTION
    // =============================
    const key = `${cleanedResolved || cleanedInput}:${entry.value}`;

    if (seen.has(key)) {
      status = "DUPLICATE";
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
// 🧼 CLEAN
// =====================================
function clean(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "")
    .trim();
}