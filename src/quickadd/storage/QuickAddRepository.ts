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

import { log } from "../logger";

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

      log.emit({
        event: "retry_attempt",
        traceId,
        data: {
          label,
          attempt,
        },
        level: "warn",
      });

      if (attempt >= RETRY_LIMIT) {
        log.emit({
          event: "retry_failed",
          traceId,
          data: { error: err, label },
          level: "error",
        });

        throw err;
      }
    }
  }
}

// =====================================
// ✏️ SAVE ADJUSTED
// =====================================

export async function saveAdjusted(
  entries: { ocr_raw: string; adjusted: string }[],
  traceId: string
) {
  assertTrace(traceId, "saveAdjusted");

  if (!entries.length) return;

  const startedAt = Date.now();

  try {
    log.emit({
      event: "adjusted_save_start",
      traceId,
      data: { count: entries.length },
    });

    let sheet = safeSheet(
      await withRetry(() => readSheet(NICKNAME_TAB), traceId, "read_nicknames")
    );

    if (sheet.length === 0) {
      sheet = [[
        "type",
        "ocr_raw",
        "layout_text",
        "parser_output",
        "adjusted",
        "override",
        "createdAt",
      ]];
    }

    const headers = sheet[0];

    const ocrIndex = headers.indexOf("ocr_raw");
    const adjustedIndex = headers.indexOf("adjusted");

    if (ocrIndex === -1 || adjustedIndex === -1) {
      log.emit({
        event: "adjusted_missing_columns",
        traceId,
        data: {},
        level: "warn",
      });
      return;
    }

    for (const entry of entries) {
      let updated = false;
      const cleaned = clean(entry.ocr_raw);

      for (let i = 1; i < sheet.length; i++) {
        const row = sheet[i];
        const ocrRaw = row[ocrIndex];

        if (!ocrRaw) continue;

        if (clean(ocrRaw) === cleaned) {
          await withRetry(
            () => updateCell(NICKNAME_TAB, i, adjustedIndex, entry.adjusted),
            traceId,
            "update_cell_adjusted"
          );

          log.emit({
            event: "adjusted_updated",
            traceId,
            data: {
              from: ocrRaw,
              to: entry.adjusted,
            },
          });

          updated = true;
          break;
        }
      }

      if (!updated) {
        sheet.push([
          "",
          entry.ocr_raw,
          "",
          "",
          entry.adjusted,
          "",
          Date.now(),
        ]);

        log.emit({
          event: "adjusted_added",
          traceId,
          data: {
            ocr: entry.ocr_raw,
            adjusted: entry.adjusted,
          },
        });
      }
    }

    await withRetry(
      () => writeSheet(NICKNAME_TAB, sheet),
      traceId,
      "write_nicknames"
    );

    log.emit({
      event: "adjusted_save_done",
      traceId,
      data: {
        count: entries.length,
        durationMs: Date.now() - startedAt,
      },
    });

  } catch (err) {
    log.emit({
      event: "adjusted_failed",
      traceId,
      data: { error: err },
      level: "error",
    });
  }
}

// =====================================
// 📥 QUEUE — POINTS
// =====================================

export async function enqueuePoints(
  entries: {
    guildId: string;
    category: string;
    week: string;
    nickname: string;
    points: number;
  }[],
  traceId: string
) {
  assertTrace(traceId, "enqueuePoints");

  if (!entries.length) return;

  const startedAt = Date.now();

  try {
    log.emit({
      event: "points_queue_start",
      traceId,
      data: { count: entries.length },
    });

    const existing = safeSheet(
      await withRetry(() => readSheet(POINTS_QUEUE_TAB), traceId, "read_points")
    );

    const rows = entries.map((e) => [
      e.guildId,
      e.category,
      e.week,
      e.nickname,
      e.points,
      "PENDING",
      Date.now(),
    ]);

    await withRetry(
      () => writeSheet(POINTS_QUEUE_TAB, [...existing, ...rows]),
      traceId,
      "write_points"
    );

    log.emit({
      event: "points_queue_done",
      traceId,
      data: {
        count: rows.length,
        durationMs: Date.now() - startedAt,
      },
    });

  } catch (err) {
    log.emit({
      event: "points_queue_failed",
      traceId,
      data: { error: err },
      level: "error",
    });

    throw err;
  }
}

// =====================================
// 📥 QUEUE — EVENTS
// =====================================

export async function enqueueEvents(
  entries: {
    guildId: string;
    eventId: string;
    type: string;
    nickname: string;
  }[],
  traceId: string
) {
  assertTrace(traceId, "enqueueEvents");

  if (!entries.length) return;

  const startedAt = Date.now();

  try {
    log.emit({
      event: "events_queue_start",
      traceId,
      data: { count: entries.length },
    });

    const existing = safeSheet(
      await withRetry(() => readSheet(EVENTS_QUEUE_TAB), traceId, "read_events")
    );

    const rows = entries.map((e) => [
      e.guildId,
      e.eventId,
      e.type,
      e.nickname,
      "PENDING",
      Date.now(),
    ]);

    await withRetry(
      () => writeSheet(EVENTS_QUEUE_TAB, [...existing, ...rows]),
      traceId,
      "write_events"
    );

    log.emit({
      event: "events_queue_done",
      traceId,
      data: {
        count: rows.length,
        durationMs: Date.now() - startedAt,
      },
    });

  } catch (err) {
    log.emit({
      event: "events_queue_failed",
      traceId,
      data: { error: err },
      level: "error",
    });

    throw err;
  }
}

// =====================================
// 📖 READ
// =====================================

export async function getLearningData(traceId: string): Promise<any[][]> {
  assertTrace(traceId, "getLearningData");

  const startedAt = Date.now();

  try {
    const data = safeSheet(
      await withRetry(() => readSheet(NICKNAME_TAB), traceId, "read_learning")
    );

    log.emit({
      event: "learning_loaded",
      traceId,
      data: {
        rows: data.length,
        durationMs: Date.now() - startedAt,
      },
    });

    return data;
  } catch (err) {
    log.emit({
      event: "learning_load_failed",
      traceId,
      data: { error: err },
      level: "error",
    });

    return [];
  }
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