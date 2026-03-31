// =====================================
// 📁 src/foundation/logger/loggerCore.ts
// =====================================

import pino from "pino";

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
// 🔹 SCOPE PARSER
// =====================================

function parseScope(scope?: string) {
  if (!scope) return { type: "app", name: undefined };

  if (!scope.includes(":")) {
    return { type: scope, name: undefined };
  }

  const [type, name] = scope.split(":");

  return { type, name };
}

function formatScope(scope?: string) {
  const parsed = parseScope(scope);

  if (!parsed.name) {
    return parsed.type.toUpperCase();
  }

  return `${parsed.type.toUpperCase()} | ${parsed.name}`;
}

// =====================================
// 🔹 HELPERS
// =====================================

function simplifyEvent(event?: string): string {
  if (!event) return "log";
  return event;
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
    default:
      return `${colors.gray}${level.toUpperCase()}${colors.reset}`;
  }
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

function getHeader(level: string, scope?: string) {
  const scopeLabel = formatScope(scope);

  return `${colors.gray}──────── ${level} | ${colors.cyan}${scopeLabel}${colors.reset} ${colors.gray}────────${colors.reset}`;
}

// =====================================
// 🔹 FORMATTER
// =====================================

function formatLog(log: any) {
  const level = colorLevel(log.level ?? "info");
  const event = simplifyEvent(log.event);

  const lines: (string | null)[] = [
    getHeader(level, log.scope),

    `${colors.green}EVENT${colors.reset} : ${event}`,

    log.flow?.step
      ? `${colors.yellow}STEP${colors.reset}  : ${log.flow.step}`
      : null,

    formatObjectBlock("META", log.meta),
    formatObjectBlock("INPUT", log.input),
    formatObjectBlock("RESULT", log.result),

    log.stats ? formatObjectBlock("STATS", log.stats) : null,

    log.error
      ? [
          `${colors.red}ERROR${colors.reset}:`,
          `  ${log.error.message || log.error}`,
        ].join("\n")
      : null,

    "",
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