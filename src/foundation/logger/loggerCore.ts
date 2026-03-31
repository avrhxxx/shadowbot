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

function formatObject(obj?: Record<string, any>) {
  if (!obj) return null;

  return Object.entries(obj)
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join(" ");
}

// =====================================
// 🔹 CUSTOM FORMATTER (STACKED CARD)
// =====================================

function formatLog(log: any) {
  const scope = resolveScope(log);
  const event = simplifyEvent(log.event);

  const trace = stripIdPrefix(log.traceId);
  const flow = stripIdPrefix(log.flowId);
  const corr = stripIdPrefix(log.correlationId);

  const step = log.flow?.step;
  const meta = log.meta;
  const stats = log.stats;
  const error = log.error;
  const decision = log.decision;
  const interaction = log.interaction;

  return `
═══════════════════════════════
${scope}
EVENT : ${event}${step ? ` → ${step}` : ""}

TRACE : ${trace}
FLOW  : ${flow}
CORR  : ${corr}

${meta ? `META  : ${formatObject(meta)}` : ""}
${stats ? `STATS : ${formatObject(stats)}` : ""}
${decision ? `DECISION : ${decision.condition} => ${decision.result}` : ""}
${interaction ? `INTERACTION : ${formatObject(interaction)}` : ""}
${error ? `ERROR : ${error.message ?? error}` : ""}
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