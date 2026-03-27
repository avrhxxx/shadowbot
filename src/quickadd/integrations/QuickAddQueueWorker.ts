// =====================================
// 📁 src/quickadd/integrations/QuickAddQueueWorker.ts
// =====================================

/**
 * 🔄 ROLE:
 * Background worker processing QuickAdd queues.
 *
 * Responsible for:
 * - polling Google Sheets queue
 * - processing entries (future)
 *
 * ❗ RULES:
 * - no business logic (yet)
 * - safe loop
 * - queueId used ONLY when processing single entries
 *
 * 🔥 LOGGER:
 * - uses log.emit ONLY
 * - system-level logs
 *
 * 🚀 READY:
 * - prepared for queueId
 * - prepared for retry system
 * - prepared for batch processing
 */

import { getQueue } from "../storage/QuickAddRepository";
import { log } from "../logger";
import { createTraceId } from "../core/IdGenerator";

// =====================================
// 📌 CONFIG
// =====================================

const INTERVAL_MS = 10_000; // 10s

// =====================================
// 🧱 TYPES
// =====================================

type QueueEntry = {
  queueId?: string;
};

// =====================================
// 🚀 START WORKER
// =====================================

export function startQuickAddWorker() {
  const systemTraceId = createTraceId();

  log.emit({
    event: "worker_started",
    traceId: systemTraceId,
    type: "system",
    data: {
      intervalMs: INTERVAL_MS,
    },
  });

  setInterval(async () => {
    const traceId = createTraceId();
    const startedAt = Date.now();

    try {
      log.emit({
        event: "worker_tick_start",
        traceId,
        type: "system",
      });

      // =====================================
      // 📥 LOAD QUEUE
      // =====================================
      const points = (await getQueue(
        "quickadd_points_queue"
      )) as QueueEntry[];

      log.emit({
        event: "queue_loaded",
        traceId,
        type: "system",
        data: {
          type: "points",
          rows: points.length,
        },
      });

      // =====================================
      // 🔍 EMPTY QUEUE
      // =====================================
      if (!points.length) {
        log.emit({
          event: "queue_empty",
          traceId,
          type: "system",
          data: {
            type: "points",
          },
        });
      }

      // =====================================
      // 🔄 PROCESS LOOP (FUTURE)
      // =====================================
      for (const entry of points) {
        log.emit({
          event: "queue_item_received",
          traceId,
          type: "system",
          data: {
            queueId: entry.queueId,
          },
        });

        // future logic
      }

      // =====================================
      // ✅ DONE
      // =====================================
      log.emit({
        event: "worker_tick_done",
        traceId,
        type: "system",
        data: {
          durationMs: Date.now() - startedAt,
        },
      });

    } catch (err) {
      log.emit({
        event: "worker_error",
        traceId,
        type: "system",
        level: "error",
        data: {
          error: err,
        },
      });

      log.emit({
        event: "worker_tick_failed",
        traceId,
        type: "system",
        level: "error",
        data: {
          durationMs: Date.now() - startedAt,
        },
      });
    }
  }, INTERVAL_MS);
}