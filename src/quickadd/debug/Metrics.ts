// =====================================
// 📁 src/quickadd/debug/Metrics.ts
// =====================================

/**
 * 📊 ROLE:
 * Lightweight metrics layer (counters).
 *
 * Responsible for:
 * - counting events (pipelines, errors, etc.)
 * - exposing simple observability data
 *
 * ❗ RULES:
 * - NO logging here
 * - NO side effects
 * - safe to call anywhere
 *
 * ✅ USE CASES:
 * - pipeline_runs
 * - validation_errors
 * - queue_processed
 */

import { LOGGER_CONFIG } from "./LoggerConfig";

const counters = new Map<string, number>();

export const metrics = {
  increment(name: string, value = 1) {
    if (!LOGGER_CONFIG.ENABLE_METRICS) return;

    const current = counters.get(name) || 0;
    counters.set(name, current + value);
  },

  get(name: string): number {
    return counters.get(name) || 0;
  },

  dump() {
    return Object.fromEntries(counters.entries());
  },

  reset() {
    counters.clear();
  },
};