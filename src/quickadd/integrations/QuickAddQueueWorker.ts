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
 */

import { getQueue } from "../storage/QuickAddRepository";
import { createLogger } from "../debug/DebugLogger";

const log = createLogger("WORKER");

// =====================================
// 📌 CONFIG
// =====================================

const INTERVAL_MS = 10_000; // 10s

// =====================================
// 🚀 START WORKER
// =====================================

export function startQuickAddWorker() {
  log.trace("worker_started", {
    intervalMs: INTERVAL_MS,
  });

  setInterval(async () => {
    const startedAt = Date.now();

    try {
      log.trace("worker_tick_start");

      // =====================================
      // 📥 LOAD QUEUE (POINTS)
      // =====================================
      const points = await getQueue("quickadd_points_queue");

      log.trace("queue_loaded", {
        type: "points",
        rows: points.length,
      });

      // =====================================
      // 🔍 EMPTY QUEUE SIGNAL (IMPORTANT)
      // =====================================
      if (!points.length) {
        log.trace("queue_empty", {
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
      log.trace("worker_tick_done", {
        durationMs: Date.now() - startedAt,
      });

    } catch (err) {
      log.error("worker_error", err);

      log.trace("worker_tick_failed", {
        durationMs: Date.now() - startedAt,
      });
    }
  }, INTERVAL_MS);
}