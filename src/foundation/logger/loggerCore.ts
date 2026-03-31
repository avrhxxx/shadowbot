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

// =====================================
// 🔹 FORMATTERS
// =====================================

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

function getHeader(level: string, scope: string) {
  return `${colors.gray}──────── ${level} | ${colors.cyan}${scope}${colors.reset} ${colors.gray}────────${colors.reset}`;
}

// =====================================
// 🔹 CUSTOM FORMATTER
// =====================================

function formatLog(log: any) {
  const scope = resolveScope(log);
  const event = simplifyEvent(log.event);
  const level = colorLevel(log.level ?? "info");

  const lines: (string | null)[] = [
    // 🔥 HEADER (zawsze)
    getHeader(level, scope),

    // 🔹 CORE
    `${colors.green}EVENT${colors.reset}   : ${event}`,

    log.flow?.step
      ? `${colors.yellow}STEP${colors.reset}    : ${log.flow.step}`
      : null,

    // 🔹 STRUCTURED BLOCKS
    formatObjectBlock("META", log.meta),
    formatObjectBlock("INPUT", log.input),
    formatObjectBlock("RESULT", log.result),

    log.stats ? formatObjectBlock("STATS", log.stats) : null,

    log.timing
      ? `${colors.yellow}TIMING${colors.reset} : ${log.timing.label} (${log.timing.durationMs}ms)`
      : null,

    // 🔥 ERROR
    log.error
      ? [
          `${colors.red}ERROR${colors.reset}:`,
          `  ${log.error.message || log.error}`,
          log.error.stack
            ? `${colors.gray}${log.error.stack}${colors.reset}`
            : null,
        ]
          .filter(Boolean)
          .join("\n")
      : null,

    // 🔹 DEBUG ONLY (trace itp.)
    log.level === "debug"
      ? [
          `${colors.gray}TRACE${colors.reset} : ${log.traceId}`,
          `${colors.gray}FLOW${colors.reset}  : ${log.flowId}`,
          `${colors.gray}CORR${colors.reset} : ${log.correlationId}`,
        ].join("\n")
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