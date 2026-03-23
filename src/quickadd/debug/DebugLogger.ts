// =====================================
// 📁 src/quickadd/debug/DebugLogger.ts
// =====================================

/**
 * 🔥 GLOBAL DEBUG SWITCH
 */
const DEBUG_ENABLED = true;

/**
 * 🔥 SCOPES – zgodne z architekturą
 */
export type DebugScope =
  | "OCR"
  | "PIPELINE"
  | "PARSER"
  | "DETECT"
  | "MAPPING"
  | "INTEGRATION"
  | "SESSION"
  | "LISTENER"
  | "COMMAND";

/**
 * =====================================
 * 🔧 CORE LOGGER
 * =====================================
 */

function logMessage(
  level: "log" | "warn" | "error",
  scope: DebugScope,
  tag: string,
  traceId?: string,
  ...args: any[]
) {
  if (!DEBUG_ENABLED) return;

  const time = new Date().toISOString().split("T")[1].split(".")[0];

  const prefix = traceId
    ? `[QA:${scope}:${tag}:${traceId}:${time}]`
    : `[QA:${scope}:${tag}:${time}]`;

  console[level](prefix, ...args);
}

/**
 * =====================================
 * 🧠 MAIN LOGGER FACTORY
 * =====================================
 *
 * 🔥 UŻYCIE:
 * const log = createLogger("COMMAND");
 * log("INIT", "something");
 */

export function createLogger(scope: DebugScope) {
  return Object.assign(
    // 🔥 DEFAULT = log()
    (tag: string, ...args: any[]) => {
      logMessage("log", scope, tag, undefined, ...args);
    },
    {
      trace: (tag: string, traceId: string, ...args: any[]) => {
        logMessage("log", scope, tag, traceId, ...args);
      },

      warn: (tag: string, ...args: any[]) => {
        logMessage("warn", scope, tag, undefined, ...args);
      },

      error: (tag: string, error: any, traceId?: string) => {
        logMessage("error", scope, tag, traceId, error);
      },
    }
  );
}