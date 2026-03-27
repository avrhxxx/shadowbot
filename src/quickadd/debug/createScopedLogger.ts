// =====================================
// 📁 src/quickadd/debug/createScopedLogger.ts
// =====================================

/**
 * 🪵 ROLE:
 * Scoped logger factory (DUAL MODE)
 *
 * ✔ trace() → TRACE LOGGER (requires traceId)
 * ✔ log()   → SYSTEM LOGGER (no traceId)
 */

import {
  __createTraceLogger,
  __createSystemLogger,
} from "./DebugLogger";

// =====================================
// 🔹 HELPERS
// =====================================

function extractScope(fileUrl: string): string {
  try {
    const file = fileUrl.split("/").pop() || "UNKNOWN";

    return file
      .replace(".ts", "")
      .replace(".js", "")
      .toUpperCase();
  } catch {
    return "UNKNOWN";
  }
}

// =====================================
// 🔹 FACTORY
// =====================================

export function createScopedLogger(fileUrl: string) {
  const scope = extractScope(fileUrl);

  const trace = __createTraceLogger(scope);
  const system = __createSystemLogger(scope);

  return {
    trace: trace.trace,
    warn: trace.warn,
    error: trace.error,

    log: system.log,
    sysWarn: system.warn,
    sysError: system.error,
  };
}