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
  log.trace("worker_started");

  setInterval(async () => {
    try {
      log.trace("worker_tick");

      // =====================================
      // 📥 LOAD QUEUE (POINTS)
      // =====================================
      const points = await getQueue("quickadd_points_queue");

      log.trace("queue_loaded", {
        type: "points",
        rows: points.length,
      });

      // =====================================
      // 🔮 FUTURE PROCESSING
      // =====================================
      // TODO: process queue

    } catch (err) {
      log.error("worker_error", err);
    }
  }, INTERVAL_MS);
}