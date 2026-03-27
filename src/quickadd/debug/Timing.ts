// =====================================
// 📁 src/quickadd/debug/Timing.ts
// =====================================

/**
 * ⏱️ ROLE:
 * Execution timing helper.
 *
 * Responsible for:
 * - measuring durations (in ms)
 * - supporting performance monitoring
 *
 * ❗ RULES:
 * - NO logging here
 * - NO side effects outside internal state
 * - must be used in pairs: start() → end()
 *
 * ⚠️ IMPORTANT:
 * - calling start() twice with same id will overwrite previous timer
 * - end() on missing id returns 0 (safe fallback)
 *
 * ✅ USE CASES:
 * - pipeline duration
 * - OCR processing time
 * - validation time
 *
 * ⚠️ ID CONVENTION:
 * - use descriptive names
 * - examples:
 *   - "pipeline"
 *   - "ocr"
 *   - "validation"
 */

import { LOGGER_CONFIG } from "./LoggerConfig";

// =====================================
// 🔹 STATE
// =====================================

const timers = new Map<string, number>();

// =====================================
// 🔥 PUBLIC API
// =====================================

export const timing = {
  /**
   * ▶️ Start timer
   */
  start(id: string) {
    if (!LOGGER_CONFIG.ENABLE_TIMING) return;

    timers.set(id, Date.now());
  },

  /**
   * ⏹️ End timer and return duration (ms)
   */
  end(id: string): number {
    if (!LOGGER_CONFIG.ENABLE_TIMING) return 0;

    const start = timers.get(id);

    if (!start) return 0;

    const duration = Date.now() - start;

    timers.delete(id);

    return duration;
  },
};

// =====================================
// 🔮 FUTURE EXTENSIONS (reserved)
// =====================================

// - auto logging integration (log.emit)
// - integration with metrics (histograms)
// - traceId-based timing