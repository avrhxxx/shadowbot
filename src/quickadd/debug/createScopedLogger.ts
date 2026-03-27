// =====================================
// 📁 src/quickadd/debug/createScopedLogger.ts
// =====================================

/**
 * 🪵 ROLE:
 * Scoped logger factory (DUAL MODE + FLOW AWARE)
 *
 * ✔ trace() → TRACE LOGGER (requires traceId)
 * ✔ log()   → SYSTEM LOGGER (no traceId)
 *
 * 🔥 NEW:
 * - flowType injected at creation (USER | SYSTEM)
 */

import {
  __createTraceLogger,
  __createSystemLogger,
  FlowType,
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
  flow: FlowType = "USER"
) {
  const scope = extractScope(filePath);

  const trace = __createTraceLogger(scope, flow);
  const system = __createSystemLogger(scope, flow);

  return {
    trace: trace.trace,
    warn: trace.warn,
    error: trace.error,

    log: system.log,
    sysWarn: system.warn,
    sysError: system.error,
  };
}