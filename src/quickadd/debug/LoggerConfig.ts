// =====================================
// 📁 src/quickadd/debug/LoggerConfig.ts
// =====================================

/**
 * ⚙️ ROLE:
 * Central configuration for logging & observability.
 *
 * ❗ RULES:
 * - SINGLE SOURCE OF TRUTH
 * - NO logic
 * - SAFE TO MODIFY anytime
 *
 * ✅ USED BY:
 * - DebugLogger
 * - Metrics
 * - Timing
 *
 * 🎯 DESIGN:
 * - clear separation of concerns
 * - easy future extensions
 */

// =====================================
// 🔹 LOGGING MODES
// =====================================

export const LOGGER_CONFIG = {
  // =====================================
  // 🔹 CORE LOGGING
  // =====================================

  ENABLE_TRACE: true,   // buffered logs (traceId required)
  ENABLE_SYSTEM: true,  // direct logs (no traceId)

  // =====================================
  // 🔹 OBSERVABILITY
  // =====================================

  ENABLE_METRICS: true,
  ENABLE_TIMING: true,

  // =====================================
  // 🔹 PERFORMANCE
  // =====================================

  MAX_BUCKET_SIZE: 500,

  // =====================================
  // 🔹 FLUSH CONTROL
  // =====================================

  FLUSH_EVENTS: [
    "pipeline_done",
    "pipeline_error",
  ],

  // =====================================
  // 🔮 FUTURE EXTENSIONS (reserved)
  // =====================================

  // ENABLE_REMOTE_LOGS: false,
  // LOG_SAMPLING_RATE: 1.0,
};