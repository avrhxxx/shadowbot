// =====================================
// 📁 src/quickadd/debug/DebugLogger.ts
// =====================================

/**
 * 🔥 GLOBAL DEBUG SWITCH
 */
const DEBUG_ENABLED = true;
const PRETTY_LOGS = true;

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
  | "COMMAND"
  | "MAP_LOADER"
  | "RESOLVER"
  | "VALIDATION"
  | "QA_SERVICE"
  | "LAYOUT";

/**
 * 🎨 Kolory ANSI
 */
const scopeColors: Record<DebugScope, string> = {
  OCR: "\x1b[36m",
  PIPELINE: "\x1b[35m",
  PARSER: "\x1b[33m",
  DETECT: "\x1b[32m",
  MAPPING: "\x1b[34m",
  INTEGRATION: "\x1b[31m",
  SESSION: "\x1b[90m",
  LISTENER: "\x1b[37m",
  COMMAND: "\x1b[94m",
  MAP_LOADER: "\x1b[95m",
  RESOLVER: "\x1b[96m",
  VALIDATION: "\x1b[92m",
  QA_SERVICE: "\x1b[91m",
  LAYOUT: "\x1b[93m",
};

const RESET = "\x1b[0m";

/**
 * =====================================
 * 🔥 TRACE GROUPING (IMPROVED)
 * =====================================
 */

let currentTraceId: string | null = null;

function handleTraceGrouping(traceId?: string) {
  if (!traceId) return;

  if (currentTraceId && currentTraceId !== traceId) {
    console.groupEnd();
    console.log("\n"); // odstęp między trace
  }

  if (currentTraceId !== traceId) {
    console.log("======================================");
    console.group(`▼ TRACE ${traceId}`);
    currentTraceId = traceId;
  }
}

/**
 * =====================================
 * 🔹 HELPERS
 * =====================================
 */

function isImportantTag(tag: string): boolean {
  return (
    tag.includes("start") ||
    tag.includes("done") ||
    tag.includes("error") ||
    tag.includes("failed")
  );
}

function printSeparator() {
  console.log("--------------------------------------------------");
}

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

  // TRACE GROUPING
  handleTraceGrouping(traceId);

  // =====================================
  // COMPACT MODE
  // =====================================
  if (!PRETTY_LOGS) {
    const prefix = traceId
      ? `[QA:${scope}:${tag}:${traceId}:${time}]`
      : `[QA:${scope}:${tag}:${time}]`;

    console[level](prefix, ...args);
    return;
  }

  // =====================================
  // PRETTY MODE
  // =====================================
  const color = scopeColors[scope] || "";
  const header = `${color}${scope}${RESET}`;
  const meta = traceId ? `${tag} #${traceId}` : tag;

  // separator dla ważnych eventów
  if (isImportantTag(tag)) {
    printSeparator();
  }

  console[level](`${header} ${meta} (${time})`);

  if (args.length > 0) {
    for (const arg of args) {
      if (typeof arg === "object") {
        console.dir(arg, { depth: null, colors: true });
      } else {
        console.log("   ", arg);
      }
    }
  }
}

/**
 * =====================================
 * 🧠 MAIN LOGGER FACTORY
 * =====================================
 */

export function createLogger(scope: DebugScope) {
  return Object.assign(
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