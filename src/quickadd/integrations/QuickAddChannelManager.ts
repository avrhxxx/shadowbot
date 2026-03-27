// =====================================
// 📁 src/quickadd/integrations/QuickAddQueueWorker.ts
// =====================================

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

      const points = await getQueue("quickadd_points_queue");

      log.trace("queue_loaded", traceId, {
        type: "points",
        rows: points.length,
      });

      if (!points.length) {
        log.trace("queue_empty", traceId, {
          type: "points",
        });
      }

      // TODO: processing

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