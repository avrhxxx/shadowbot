// =====================================
// 📁 src/observability/Observability.ts
// =====================================

import { ObservabilityEngine } from "./core/ObservabilityEngine";

// =====================================
// 🔹 TYPES (PUBLIC CONTRACT)
// =====================================

type LogLevel = "info" | "warn" | "error";
type TraceType = "user" | "system";

// =====================================
// 🔥 PUBLIC API
// =====================================

export const log = {
  emit(input: {
    event: string;
    traceId?: string;
    data?: any;

    level?: LogLevel;
    type?: TraceType;

    system?: string;
    layer?: string;
  }) {
    ObservabilityEngine.emit(input);
  },
};

// =====================================
// 🔹 OBSERVABILITY EXPORTS
// =====================================

export { metrics } from "./observability/Metrics";
export { timing } from "./observability/Timing";