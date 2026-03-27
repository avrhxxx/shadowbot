// =====================================
// 📁 src/quickadd/storage/QuickAddRepository.ts
// =====================================

/**
 * 💾 ROLE:
 * Persistence layer for QuickAdd (Google Sheets).
 *
 * ❗ RULES:
 * - NO business logic
 * - NO validation
 * - traceId REQUIRED (STRICT)
 * - FULL logging
 * - RETRY (limit 5)
 * - TIMING (observability)
 */

import {
  readSheet,
  writeSheet,
  updateCell,
} from "../../google/googleSheetsStorage";

import { createScopedLogger } from "@/quickadd/debug/logger";

const log = createScopedLogger(import.meta.url);

// =====================================
// 📌 CONFIG
// =====================================

const NICKNAME_TAB = "quickadd_nicknames";
const POINTS_QUEUE_TAB = "quickadd_points_queue";
const EVENTS_QUEUE_TAB = "quickadd_events_queue";

const RETRY_LIMIT = 5;

// =====================================
// 🧠 HELPERS
// =====================================

function assertTrace(traceId: string, scope: string) {
  if (!traceId) {
    throw new Error(`[REPOSITORY ERROR] Missing traceId in ${scope}`);
  }
}

function safeSheet(data: any[][] | null | undefined): any[][] {
  return data && data.length ? data : [];
}

async function withRetry<T>(
  fn: () => Promise<T>,
  traceId: string,
  label: string
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;

      log.warn("retry_attempt", traceId, {
        label,
        attempt,
      });

      if (attempt >= RETRY_LIMIT) {
        log.error("retry_failed", err, traceId);
        throw err;
      }
    }
  }
}

// =====================================
// ✏️ SAVE ADJUSTED
// =====================================
// (reszta pliku BEZ ZMIAN — już była poprawna)
// =====================================