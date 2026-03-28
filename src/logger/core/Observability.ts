// =====================================
// 📁 src/logger/core/Observability.ts
// =====================================

import { LogInput } from "../observability/ObservabilityTypes";
import { ObservabilityDispatcher } from "./ObservabilityDispatcher";

// =====================================
// 🔥 PUBLIC API
// =====================================

export const Observability = {
  emit(input: LogInput) {
    ObservabilityDispatcher.emit(input);
  },
};