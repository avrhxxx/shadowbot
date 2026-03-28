// =====================================
// 📁 src/logger/core/ObservabilityDispatcher.ts
// =====================================

import { LogInput } from "../observability/ObservabilityTypes";
import { ObservabilityEngine } from "./ObservabilityEngine";

// =====================================
// 🔥 DISPATCHER
// =====================================

export const ObservabilityDispatcher = {
  emit(input: LogInput) {
    // 🔮 FUTURE:
    // - send to DB
    // - send to Sentry
    // - send to queue

    ObservabilityEngine.emit(input);
  },
};