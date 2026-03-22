// =====================================
// 📁 src/quickadd/debug/DebugLogger.ts
// =====================================

/**
 * 🔥 GLOBAL DEBUG SWITCH
 * Możesz to później podpiąć pod ENV (process.env.DEBUG === "true")
 */
const DEBUG_ENABLED = true;

/**
 * 🔥 SCOPES – uporządkowane według architektury
 */
type DebugScope =
  | "OCR"
  | "PIPELINE"
  | "PARSER"
  | "DETECT"
  | "MAPPING"
  | "INTEGRATION"
  | "SESSION"
  | "LISTENER";

/**
 * 🔥 OPCJE DEBUGA
 */
interface DebugOptions {
  traceId?: string;
}

/**
 * 🧠 GŁÓWNY LOGGER
 */
export function debug(
  scope: DebugScope,
  tag: string,
  ...args: any[]
) {
  if (!DEBUG_ENABLED) return;

  console.log(formatPrefix(scope, tag), ...args);
}

/**
 * 🧠 LOGGER Z TRACE (🔥 KLUCZOWE DO OCR PIPELINE)
 */
export function debugTrace(
  scope: DebugScope,
  tag: string,
  traceId: string,
  ...args: any[]
) {
  if (!DEBUG_ENABLED) return;

  console.log(formatPrefix(scope, tag, traceId), ...args);
}

/**
 * ❌ ERROR LOGGER
 */
export function debugError(
  scope: DebugScope,
  tag: string,
  error: any,
  traceId?: string
) {
  if (!DEBUG_ENABLED) return;

  console.error(formatPrefix(scope, tag, traceId), error);
}

/**
 * ⚠️ WARN LOGGER
 */
export function debugWarn(
  scope: DebugScope,
  tag: string,
  ...args: any[]
) {
  if (!DEBUG_ENABLED) return;

  console.warn(formatPrefix(scope, tag), ...args);
}

/**
 * =====================================
 * 🔧 FORMATTER
 * =====================================
 */
function formatPrefix(
  scope: DebugScope,
  tag: string,
  traceId?: string
) {
  const time = new Date().toISOString().split("T")[1].split(".")[0];

  if (traceId) {
    return `[QA:${scope}:${tag}:${traceId}:${time}]`;
  }

  return `[QA:${scope}:${tag}:${time}]`;
}