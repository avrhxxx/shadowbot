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
 *
 * 🔥 LOGGER UPDATE:
 * - uses createScopedLogger
 * - SYSTEM traceId per tick
 */

import { getQueue } from "../storage/QuickAddRepository";
import { createScopedLogger } from "@/quickadd/debug/logger";
import { createTraceId } from "../core/IdGenerator";

const log = createScopedLogger(import.meta.url);

// =====================================
// 📌 CONFIG
// =====================================

const INTERVAL_MS = 10_000; // 10s

// =====================================
// 🚀 START WORKER
// =====================================

export function startQuickAddWorker() {
  const systemTraceId = createTraceId();

  log.trace("worker_started", systemTraceId, {
    intervalMs: INTERVAL_MS,
  });

  setInterval(async () => {
    const traceId = createTraceId(); // 🔥 NEW TRACE PER TICK
    const startedAt = Date.now();

    try {
      log.trace("worker_tick_start", traceId);

      // =====================================
      // 📥 LOAD QUEUE (POINTS)
      // =====================================
      const points = await getQueue("quickadd_points_queue");

      log.trace("queue_loaded", traceId, {
        type: "points",
        rows: points.length,
      });

      // =====================================
      // 🔍 EMPTY QUEUE SIGNAL (IMPORTANT)
      // =====================================
      if (!points.length) {
        log.trace("queue_empty", traceId, {
          type: "points",
        });
      }

      // =====================================
      // 🔮 FUTURE PROCESSING
      // =====================================
      // TODO: process queue

      // =====================================
      // ✅ TICK DONE
      // =====================================
      log.trace("worker_tick_done", traceId, {
        durationMs: Date.now() - startedAt,
      });

    } catch (err) {
      log.error("worker_error", err, traceId);

      log.trace("worker_tick_failed", traceId, {
        durationMs: Date.now() - startedAt,
      });
    }
  }, INTERVAL_MS);
}