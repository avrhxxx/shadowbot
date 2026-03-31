// =====================================
// 📁 src/foundation/logger/loggerCore.ts
// =====================================

import pino from "pino";

// =====================================
// 🎨 COLORS (ANSI - Railway wspiera)
// =====================================

const colors = {
  reset: "\x1b[0m",

  gray: "\x1b[90m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  magenta: "\x1b[35m",
};

// =====================================
// 🔹 HELPERS
// =====================================

function resolveScope(obj: any): string {
  if (obj?.meta?.system) return `SYSTEM ${obj.meta.system}`;
  if (obj?.system) return `SYSTEM ${obj.system}`;
  return "APP";
}

function simplifyEvent(event?: string): string {
  if (!event) return "log";
  const parts = event.split(".");
  return parts[parts.length - 1];
}

function colorLevel(level: string) {
  switch (level) {
    case "error":
    case "fatal":
      return `${colors.red}${level.toUpperCase()}${colors.reset}`;
    case "warn":
      return `${colors.yellow}${level.toUpperCase()}${colors.reset}`;
    case "info":
      return `${colors.green}${level.toUpperCase()}${colors.reset}`;
    case "debug":
    default:
      return `${colors.gray}${level.toUpperCase()}${colors.reset}`;
  }
}

function formatKV(label: string, value: any) {
  if (value === undefined || value === null) return null;
  return `${colors.gray}${label}${colors.reset} : ${value}`;
}

function formatObjectBlock(label: string, obj?: Record<string, any>) {
  if (!obj || Object.keys(obj).length === 0) return null;

  const entries = Object.entries(obj)
    .map(
      ([k, v]) =>
        `  ${colors.cyan}${k}${colors.reset}: ${JSON.stringify(v)}`
    )
    .join("\n");

  return `${colors.magenta}${label}${colors.reset}:\n${entries}`;
}

// =====================================
// 🔹 FLOW GROUPING (lekki)
// =====================================

let lastFlowId: string | undefined;

function getFlowSeparator(flowId?: string) {
  if (!flowId) return null;

  if (flowId !== lastFlowId) {
    lastFlowId = flowId;
    return `${colors.gray}──────── FLOW ${flowId} ────────${colors.reset}`;
  }

  return null;
}

// =====================================
// 🔹 CUSTOM FORMATTER
// =====================================

function formatLog(log: any) {
  const scope = resolveScope(log);
  const event = simplifyEvent(log.event);
  const level = colorLevel(log.level ?? "info");

  const flowSeparator = getFlowSeparator(log.flowId);

  const lines: (string | null)[] = [
    flowSeparator,

    `${level} | ${colors.cyan}${scope}${colors.reset}`,
    `${colors.green}EVENT${colors.reset} : ${event}`,

    // IDs (pełne, bez stripowania)
    formatKV("TRACE", log.traceId),
    formatKV("FLOW", log.flowId),
    formatKV("CORR", log.correlationId),

    // STEP
    log.flow?.step
      ? `${colors.yellow}STEP${colors.reset}  : ${log.flow.step}`
      : null,

    // META / INPUT / RESULT
    formatObjectBlock("META", log.meta),
    formatObjectBlock("INPUT", log.input),
    formatObjectBlock("RESULT", log.result),

    // TIMING
    log.timing
      ? `${colors.yellow}TIMING${colors.reset} : ${log.timing.label} (${log.timing.durationMs}ms)`
      : null,

    log.stats ? formatObjectBlock("STATS", log.stats) : null,

    // ERROR BLOCK (mocny wizualnie)
    log.error
      ? [
          `${colors.red}──────── ERROR ────────${colors.reset}`,
          `${colors.red}${log.error.message || log.error}${colors.reset}`,
          log.error.stack
            ? `${colors.gray}${log.error.stack}${colors.reset}`
            : null,
        ]
          .filter(Boolean)
          .join("\n")
      : null,
  ];

  return lines.filter(Boolean).join("\n");
}

// =====================================
// 🔹 LOGGER
// =====================================

export const baseLogger = pino({
  level: "debug",

  formatters: {
    log(obj) {
      return { msg: formatLog(obj) };
    },
  },

  messageKey: "msg",
  base: undefined,
  timestamp: false,
});