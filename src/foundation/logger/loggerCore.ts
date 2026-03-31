// =====================================
// 📁 src/foundation/logger/loggerCore.ts
// =====================================

import pino from "pino";

// =====================================
// 🔹 HELPERS
// =====================================

function resolveScope(obj: any): string {
  if (obj?.meta?.system) return `SYSTEM ${obj.meta.system}`;
  if (obj?.system) return `SYSTEM ${obj.system}`;
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

function stripIdPrefix(id?: string) {
  if (!id) return "-";
  const parts = id.split(":");
  return parts.length > 1 ? parts[1] : id;
}

// =====================================
// 🔹 CUSTOM FORMATTER (STACKED CARD)
// =====================================

function formatLog(log: any) {
  const time = formatTime(log.time);
  const scope = resolveScope(log);
  const event = simplifyEvent(log.event);

  const trace = stripIdPrefix(log.traceId);
  const flow = stripIdPrefix(log.flowId);
  const corr = stripIdPrefix(log.correlationId);

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

  formatters: {
    log(obj) {
      return { msg: formatLog(obj) };
    },
  },

  messageKey: "msg",

  base: undefined,
  timestamp: false,
});