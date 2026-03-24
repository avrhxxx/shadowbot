// =====================================
// 📁 src/quickadd/debug/DebugLogger.ts
// =====================================

const DEBUG_ENABLED = true;
const PRETTY_LOGS = true; // 🔥 NEW

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

// 🎨 kolory per scope (ANSI)
const scopeColors: Record<DebugScope, string> = {
  OCR: "\x1b[36m",        // cyan
  PIPELINE: "\x1b[35m",   // magenta
  PARSER: "\x1b[33m",     // yellow
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

function logMessage(
  level: "log" | "warn" | "error",
  scope: DebugScope,
  tag: string,
  traceId?: string,
  ...args: any[]
) {
  if (!DEBUG_ENABLED) return;

  const time = new Date().toISOString().split("T")[1].split(".")[0];

  if (!PRETTY_LOGS) {
    const prefix = traceId
      ? `[QA:${scope}:${tag}:${traceId}:${time}]`
      : `[QA:${scope}:${tag}:${time}]`;

    console[level](prefix, ...args);
    return;
  }

  // =====================================
  // 🔥 PRETTY MODE
  // =====================================

  const color = scopeColors[scope] || "";
  const idPart = traceId ? `#${traceId}` : "";

  const header = `${color}${scope}${RESET}`;
  const meta = `${tag} ${idPart}`.trim();

  console[level](
    `${header} ${meta} ${RESET}(${time})`
  );

  if (args.length > 0) {
    console[level]("   ", ...args);
  }
}

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