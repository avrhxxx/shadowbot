// =====================================
// 📁 src/foundation/logger/loggerCore.ts
// =====================================

import pino from "pino";

// =====================================
// 🔹 ENV
// =====================================

const isDev = process.env.NODE_ENV !== "production";

// =====================================
// 🔹 HELPERS
// =====================================

function resolveScope(obj: any): string {
  if (obj?.meta?.system) return `SYSTEM: ${obj.meta.system}`;
  if (obj?.system) return `SYSTEM: ${obj.system}`;
  return "APP";
}

function formatTime(ts?: number) {
  const date = ts ? new Date(ts) : new Date();
  return date.toISOString().split("T")[1].split(".")[0]; // HH:MM:SS
}

function simplifyEvent(event?: string): string {
  if (!event) return "log";
  const parts = event.split(".");
  return parts[parts.length - 1];
}

// =====================================
// 🔹 CUSTOM FORMATTER (STACKED CARD)
// =====================================

function formatLog(log: any) {
  const time = formatTime(log.time);
  const scope = resolveScope(log);
  const event = simplifyEvent(log.event);

  const trace = log.traceId ?? "-";
  const flow = log.flowId ?? "-";
  const corr = log.correlationId ?? "-";

  return `
═══════════════════════════════
${scope}
EVENT : ${event}
TIME  : ${time}
──────────────
TRACE : ${trace}
FLOW  : ${flow}
CORR  : ${corr}
═══════════════════════════════
`.trim();
}

// =====================================
// 🔹 LOGGER
// =====================================

export const baseLogger = pino({
  level: "debug",

  // ❗ klucz: wyłączamy JSON output
  formatters: {
    log(obj) {
      return { msg: formatLog(obj) };
    },
  },

  messageKey: "msg",

  // ❗ usuwamy zbędne rzeczy z pino
  base: undefined,

  timestamp: false,
});