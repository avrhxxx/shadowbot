// =====================================
// 📁 src/system/quickadd/storage/QuickAddRepository.ts
// =====================================

import {
  readSheet,
  writeSheet,
  updateCell,
} from "../../google/googleSheetsStorage";

import { log } from "../../core/logger/log";
import { TraceContext } from "../../core/trace/TraceContext";

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

function safeSheet(data: any[][] | null | undefined): any[][] {
  return data && data.length ? data : [];
}

async function withRetry<T>(
  fn: () => Promise<T>,
  ctx: TraceContext,
  label: string
): Promise<T> {
  const l = log.ctx(ctx);

  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;

      l.warn("retry_attempt", {
        label,
        attempt,
      });

      if (attempt >= RETRY_LIMIT) {
        l.error("retry_failed", {
          label,
          error: err,
        });

        throw err;
      }
    }
  }
}

// =====================================
// 📥 QUEUE READ
// =====================================

export async function getQueue(
  type: "points" | "events",
  ctx: TraceContext
): Promise<any[][]> {
  const l = log.ctx(ctx);
  const startedAt = Date.now();

  const tab =
    type === "points"
      ? POINTS_QUEUE_TAB
      : EVENTS_QUEUE_TAB;

  try {
    const data = safeSheet(
      await withRetry(() => readSheet(tab), ctx, "read_queue")
    );

    l.event("queue_loaded", {
      type,
    }, {
      rows: data.length,
      durationMs: Date.now() - startedAt,
    });

    return data;
  } catch (err) {
    l.error("queue_load_failed", {
      type,
      error: err,
    });

    return [];
  }
}

// =====================================
// ✏️ SAVE ADJUSTED
// =====================================

export async function saveAdjusted(
  entries: { ocr_raw: string; adjusted: string }[],
  ctx: TraceContext
) {
  const l = log.ctx(ctx);

  if (!entries.length) return;

  const startedAt = Date.now();

  try {
    l.event("adjusted_save_start", {}, {
      count: entries.length,
    });

    let sheet = safeSheet(
      await withRetry(() => readSheet(NICKNAME_TAB), ctx, "read_nicknames")
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
      l.warn("adjusted_missing_columns");
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
            ctx,
            "update_cell_adjusted"
          );

          l.event("adjusted_updated", {
            from: ocrRaw,
            to: entry.adjusted,
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

        l.event("adjusted_added", {
          ocr: entry.ocr_raw,
          adjusted: entry.adjusted,
        });
      }
    }

    await withRetry(
      () => writeSheet(NICKNAME_TAB, sheet),
      ctx,
      "write_nicknames"
    );

    l.event("adjusted_save_done", {}, {
      count: entries.length,
      durationMs: Date.now() - startedAt,
    });

  } catch (err) {
    l.error("adjusted_failed", {
      error: err,
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
  ctx: TraceContext
) {
  const l = log.ctx(ctx);

  if (!entries.length) return;

  const startedAt = Date.now();

  try {
    l.event("points_queue_start", {}, {
      count: entries.length,
    });

    const existing = safeSheet(
      await withRetry(() => readSheet(POINTS_QUEUE_TAB), ctx, "read_points")
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
      ctx,
      "write_points"
    );

    l.event("points_queue_done", {}, {
      count: rows.length,
      durationMs: Date.now() - startedAt,
    });

  } catch (err) {
    l.error("points_queue_failed", {
      error: err,
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
  ctx: TraceContext
) {
  const l = log.ctx(ctx);

  if (!entries.length) return;

  const startedAt = Date.now();

  try {
    l.event("events_queue_start", {}, {
      count: entries.length,
    });

    const existing = safeSheet(
      await withRetry(() => readSheet(EVENTS_QUEUE_TAB), ctx, "read_events")
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
      ctx,
      "write_events"
    );

    l.event("events_queue_done", {}, {
      count: rows.length,
      durationMs: Date.now() - startedAt,
    });

  } catch (err) {
    l.error("events_queue_failed", {
      error: err,
    });

    throw err;
  }
}

// =====================================
// 📖 READ
// =====================================

export async function getLearningData(
  ctx: TraceContext
): Promise<any[][]> {
  const l = log.ctx(ctx);
  const startedAt = Date.now();

  try {
    const data = safeSheet(
      await withRetry(() => readSheet(NICKNAME_TAB), ctx, "read_learning")
    );

    l.event("learning_loaded", {}, {
      rows: data.length,
      durationMs: Date.now() - startedAt,
    });

    return data;
  } catch (err) {
    l.error("learning_load_failed", {
      error: err,
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