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
  ENABLE_TRACE: true,
  ENABLE_SYSTEM: true,

  MAX_BUCKET_SIZE: 500,

  FLUSH_EVENTS: [
    "pipeline_done",
    "pipeline_error",
  ],

  ENABLE_METRICS: true,
  ENABLE_TIMING: true,
};