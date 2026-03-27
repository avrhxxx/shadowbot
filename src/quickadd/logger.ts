// =====================================
// 📁 src/quickadd/logger.ts
// =====================================

/**
 * 🧠 ROLE:
 * GLOBAL, IMMUTABLE LOGGER API
 *
 * ❗ THIS FILE MUST NEVER CHANGE (API LEVEL)
 *
 * ✅ BUSINESS FILES USE ONLY THIS
 * ✅ ALL CHANGES HAPPEN BELOW (DebugLogger)
 */

import { DebugLogger } from "./debug/DebugLogger";

// =====================================
// 🔥 FINAL API (LOCKED)
// =====================================

export const log = {
  emit(input: {
    scope: string;
    event: string;
    traceId?: string;
    data?: any;
    level?: "trace" | "warn" | "error" | "system";
  }) {
    DebugLogger.emit(input);
  },
};

// =====================================
// 🔹 OBSERVABILITY EXPORTS
// =====================================

export { metrics } from "./debug/Metrics";
export { timing } from "./debug/Timing";