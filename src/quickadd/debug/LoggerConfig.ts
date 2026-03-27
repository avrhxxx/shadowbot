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
 */

export const LOGGER_CONFIG = {
  ENABLE_LOGS: true,

  ENABLE_TRACE: true,
  ENABLE_SYSTEM: true,

  ENABLE_METRICS: true,
  ENABLE_TIMING: true,

  MAX_BUCKET_SIZE: 500,

  FLUSH_EVENTS: [
    "pipeline_done",
    "pipeline_error",
  ],
};