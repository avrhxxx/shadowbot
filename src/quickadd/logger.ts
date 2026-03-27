// =====================================
// 📁 src/quickadd/logger.ts
// =====================================

/**
 * 🧠 ROLE:
 * GLOBAL, IMMUTABLE LOGGER API
 *
 * ❗ THIS FILE IS THE ONLY PUBLIC LOGGER CONTRACT
 * ❗ THIS API MUST NEVER CHANGE
 *
 * ✅ BUSINESS FILES IMPORT ONLY FROM HERE
 * ✅ NO direct access to DebugLogger
 *
 * 🎯 DESIGN GOALS:
 * - zero refactor on logger changes
 * - minimal input required
 * - automatic scope resolution
 * - clear separation:
 *    - level → severity
 *    - type  → flow (user/system)
 */

import { DebugLogger } from "./debug/DebugLogger";

// =====================================
// 🔹 TYPES (LOCKED CONTRACT)
// =====================================

type LogLevel = "info" | "warn" | "error";
type TraceType = "user" | "system";

// =====================================
// 🔥 FINAL API (DO NOT CHANGE)
// =====================================

export const log = {
  emit(input: {
    event: string;
    traceId?: string;
    data?: any;

    level?: LogLevel;   // default: "info"
    type?: TraceType;   // default: "user"
  }) {
    DebugLogger.emit(input);
  },
};

// =====================================
// 🔹 OBSERVABILITY EXPORTS
// =====================================

export { metrics } from "./debug/Metrics";
export { timing } from "./debug/Timing";