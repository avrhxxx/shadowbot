// =====================================
// 📁 src/quickadd/debug/Timing.ts
// =====================================

/**
 * ⏱️ ROLE:
 * Execution timing helper.
 *
 * Responsible for:
 * - measuring durations (ms)
 * - supporting performance monitoring
 *
 * ❗ RULES:
 * - NO logging here
 * - NO side effects
 * - must be paired start() → end()
 *
 * ✅ USE CASES:
 * - pipeline duration
 * - OCR time
 * - validation time
 */

import { LOGGER_CONFIG } from "./LoggerConfig";

const timers = new Map<string, number>();

export const timing = {
  start(id: string) {
    if (!LOGGER_CONFIG.ENABLE_TIMING) return;
    timers.set(id, Date.now());
  },

  end(id: string): number {
    if (!LOGGER_CONFIG.ENABLE_TIMING) return 0;

    const start = timers.get(id);
    if (!start) return 0;

    const duration = Date.now() - start;
    timers.delete(id);

    return duration;
  },
};