// =====================================
// 📁 src/logger/core/ObservabilityDispatcher.ts
// =====================================

import { LoggerEmitOptions } from "../observability/ObservabilityTypes";
import { ObservabilityEngine } from "./ObservabilityEngine";

/**
 * ❄️ FROZEN MODULE
 * Dispatch layer for logs.
 */

// =====================================
// 🔥 DISPATCHER
// =====================================

export const ObservabilityDispatcher = {
  emit(input: LoggerEmitOptions) {
    // 🔮 FUTURE EXTENSIONS:
    // - send to DB
    // - send to Sentry
    // - send to queue
    // - send to external observability tools

    ObservabilityEngine.emit(input);
  },
};