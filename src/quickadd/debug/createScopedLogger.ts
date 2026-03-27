// =====================================
// 📁 src/quickadd/debug/createScopedLogger.ts
// =====================================

/**
 * 🪵 ROLE:
 * Scoped logger factory (TRACE TYPE AWARE)
 *
 * ✔ injects traceType (USER | SYSTEM)
 * ✔ enforces consistent logging
 *
 * ❗ ALWAYS use this
 */

import {
  __createTraceLogger,
  TraceType,
} from "./DebugLogger";

// =====================================
// 🔹 HELPERS
// =====================================

function extractScope(filePath: string): string {
  try {
    const normalized = filePath.replace(/\\/g, "/");
    const file = normalized.split("/").pop() || "UNKNOWN";

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

export function createScopedLogger(
  filePath: string,
  traceType: TraceType = "USER"
) {
  const scope = extractScope(filePath);

  const trace = __createTraceLogger(scope, traceType);

  return {
    trace: trace.trace,
    warn: trace.warn,
    error: trace.error,
  };
}