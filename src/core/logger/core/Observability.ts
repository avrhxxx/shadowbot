// =====================================
// 📁 src/core/logger/core/Observability.ts
// =====================================

import { LoggerEmitOptions } from "../observability/ObservabilityTypes";
import { ObservabilityDispatcher } from "./ObservabilityDispatcher";

/**
 * ❄️ FROZEN MODULE
 * Public API for logging.
 * Do NOT change without full system review.
 */

// =====================================
// 🔥 PUBLIC API
// =====================================

export const Observability = {
  emit(input: LoggerEmitOptions) {
    ObservabilityDispatcher.emit(input);
  },
};
