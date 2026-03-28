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
 * - uses logger.emit ONLY
 *
 * 🚀 READY:
 * - prepared for queueId
 * - prepared for retry system
 * - prepared for batch processing
 */

import { getQueue } from "../storage/QuickAddRepository";
import { logger } from "../../core/logger/log";
import { createTraceId } from "../../core/IdGenerator";

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

  logger.emit({
    scope: "quickadd.worker",
    event: "worker_started",
    traceId: systemTraceId,
    context: {
      intervalMs: INTERVAL_MS,
    },
  });

  setInterval(async () => {
    const traceId = createTraceId();
    const startedAt = Date.now();

    try {
      logger.emit({
        scope: "quickadd.worker",
        event: "worker_tick_start",
        traceId,
      });

      // =====================================
      // 📥 LOAD QUEUE
      // =====================================
      const points = (await getQueue(
        "points",
        traceId
      )) as QueueEntry[];

      logger.emit({
        scope: "quickadd.worker",
        event: "queue_loaded",
        traceId,
        context: {
          queueType: "points",
          rows: points.length,
        },
      });

      // =====================================
      // 🔍 EMPTY QUEUE
      // =====================================
      if (!points.length) {
        logger.emit({
          scope: "quickadd.worker",
          event: "queue_empty",
          traceId,
          context: {
            queueType: "points",
          },
        });
      }

      // =====================================
      // 🔄 PROCESS LOOP (FUTURE)
      // =====================================
      for (const entry of points) {
        logger.emit({
          scope: "quickadd.worker",
          event: "queue_item_received",
          traceId,
          context: {
            queueId: entry.queueId,
          },
        });

        // future logic
      }

      // =====================================
      // ✅ DONE
      // =====================================
      const duration = Date.now() - startedAt;

      logger.emit({
        scope: "quickadd.worker",
        event: "worker_tick_done",
        traceId,
        stats: {
          durationMs: duration,
        },
      });

    } catch (err) {
      const duration = Date.now() - startedAt;

      logger.emit({
        scope: "quickadd.worker",
        event: "worker_error",
        traceId,
        level: "error",
        error: err,
      });

      logger.emit({
        scope: "quickadd.worker",
        event: "worker_tick_failed",
        traceId,
        level: "error",
        stats: {
          durationMs: duration,
        },
      });
    }
  }, INTERVAL_MS);
}