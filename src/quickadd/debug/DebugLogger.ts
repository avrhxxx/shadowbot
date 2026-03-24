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
 * 🔥 LOG LEVELS
 */
type LogLevel = "INFO" | "WARN" | "ERROR";

/**
 * 🎨 ANSI COLORS
 */
const levelColors: Record<LogLevel, string> = {
  INFO: "\x1b[37m",   // white
  WARN: "\x1b[33m",   // yellow
  ERROR: "\x1b[31m",  // red
};

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
 * 🔥 TRACE + FLOW STATE
 * =====================================
 */

let currentTraceId: string | null = null;
let currentScope: DebugScope | null = null;
let logCounter = 0;

/**
 * =====================================
 * 🧱 HELPERS
 * =====================================
 */

function formatObject(obj: any): string {
  if (typeof obj !== "object" || obj === null) return String(obj);

  return Object.entries(obj)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" | ");
}

function printTraceHeader(traceId: string) {
  console.log(`\n══════════ TRACE ${traceId} ══════════`);
}

function printScopeSeparator(scope: DebugScope) {
  const color = scopeColors[scope] || "";
  console.log(`${color}━━━━━━━━━━ ${scope} ━━━━━━━━━━${RESET}`);
}

function maybePrintSeparator() {
  logCounter++;
  if (logCounter % 6 === 0) {
    console.log("------------------------------");
  }
}

function handleGrouping(scope: DebugScope, traceId?: string) {
  if (!traceId) return;

  // 🔁 new trace
  if (currentTraceId !== traceId) {
    printTraceHeader(traceId);
    currentTraceId = traceId;
    currentScope = null;
  }

  // 🔁 new scope
  if (currentScope !== scope) {
    printScopeSeparator(scope);
    currentScope = scope;
  }
}

/**
 * =====================================
 * 🔧 CORE LOGGER
 * =====================================
 */

function logMessage(
  level: LogLevel,
  scope: DebugScope,
  tag: string,
  traceId?: string,
  ...args: any[]
) {
  if (!DEBUG_ENABLED) return;

  const time =