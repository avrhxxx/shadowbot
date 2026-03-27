// =====================================
// 📁 src/quickadd/debug/LoggerConfig.ts
// =====================================

/**
 * ⚙️ ROLE:
 * Central configuration for entire logging & observability layer.
 *
 * Responsible for:
 * - enabling/disabling features
 * - controlling performance limits
 * - defining flush behavior
 *
 * ❗ RULES:
 * - SINGLE SOURCE OF TRUTH for logging behavior
 * - NO logic here (config only)
 * - safe to modify without touching other files
 *
 * ✅ USED BY:
 * - DebugLogger
 * - Metrics
 * - Timing
 */

export const LOGGER_CONFIG = {
  // =====================================
  // 🔹 MODES
  // =====================================

  ENABLE_TRACE: true,   // user/system trace logs (buffered)
  ENABLE_SYSTEM: true,  // direct console logs

  // =====================================
  // 🔹 PERFORMANCE
  // =====================================

  MAX_BUCKET_SIZE: 500, // max logs per trace

  // =====================================
  // 🔹 FLUSH CONTROL
  // =====================================

  FLUSH_EVENTS: [
    "pipeline_done",
    "pipeline_error",
  ],

  // =====================================
  // 🔹 OBSERVABILITY
  // =====================================

  ENABLE_METRICS: true,
  ENABLE_TIMING: true,
};