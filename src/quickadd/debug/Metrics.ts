// =====================================
// 📁 src/quickadd/debug/Metrics.ts
// =====================================

/**
 * 📊 ROLE:
 * Lightweight metrics layer (counters).
 *
 * Responsible for:
 * - counting events across system
 * - exposing simple observability data
 *
 * ❗ RULES:
 * - NO logging here
 * - NO side effects outside internal state
 * - SAFE to call from any layer
 *
 * ✅ USE CASES:
 * - pipeline_runs
 * - validation_errors
 * - queue_processed
 *
 * ⚠️ NAMING CONVENTION:
 * - use snake_case
 * - keep names consistent across system
 * - examples:
 *   - "pipeline_runs"
 *   - "pipeline_errors"
 *   - "ocr_requests"
 */

import { LOGGER_CONFIG } from "./LoggerConfig";

// =====================================
// 🔹 STATE
// =====================================

const counters = new Map<string, number>();

// =====================================
// 🔥 PUBLIC API
// =====================================

export const metrics = {
  /**
   * ➕ Increment counter
   */
  increment(name: string, value = 1) {
    if (!LOGGER_CONFIG.ENABLE_METRICS) return;

    const current = counters.get(name) || 0;
    counters.set(name, current + value);
  },

  /**
   * 📥 Get single metric
   */
  get(name: string): number {
    return counters.get(name) || 0;
  },

  /**
   * 📤 Dump all metrics (snapshot)
   */
  dump(): Record<string, number> {
    return Object.fromEntries(counters.entries());
  },

  /**
   * ♻️ Reset all metrics
   */
  reset() {
    counters.clear();
  },
};

// =====================================
// 🔮 FUTURE EXTENSIONS (reserved)
// =====================================

// - labels/tags support
// - histograms (latency buckets)
// - external exporters (Prometheus, OpenTelemetry)