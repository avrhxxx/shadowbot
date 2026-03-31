// =====================================
// 📁 src/core/logger/loggerFormat.ts
// =====================================

import type { LogPayload } from "./loggerTypes.js";

// =====================================
// 🎨 COLORS
// =====================================

const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  gray: "\x1b[90m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
};

// =====================================
// 🔧 HELPERS
// =====================================

function getLevelColor(level: string) {
  switch (level) {
    case "fatal":
    case "error":
      return COLORS.red;
    case "warn":
      return COLORS.yellow;
    case "info":
      return COLORS.green;
    default:
      return COLORS.gray;
  }
}

function clean<T>(obj: T): T | undefined {
  if (!obj || typeof obj !== "object") return obj;

  const entries = Object.entries(obj).filter(
    ([, v]) => v !== undefined && v !== null
  );

  if (!entries.length) return undefined;

  return Object.fromEntries(entries) as T;
}

function shortId(id?: string) {
  if (!id) return "-";
  return id.split("-")[1]?.slice(0, 4) ?? id;
}

// =====================================
// 🔥 FORMATTER
// =====================================

export function loggerFormat(payload: LogPayload) {
  const level = payload.level ?? "info";
  const color = getLevelColor(level);

  const time = payload.timestamp ?? new Date().toISOString();
  const scope = payload.scope ?? "unknown";

  const header =
    `${COLORS.dim}${time}${COLORS.reset} ` +
    `${color}[${level.toUpperCase()}]${COLORS.reset} ` +
    `${COLORS.cyan}[${scope}]${COLORS.reset} ` +
    `${payload.event} ` +
    `${COLORS.gray}(t-${shortId(payload.traceId)})${COLORS.reset}`;

  console.group(header);

  if (payload.tags) console.log("tags:", payload.tags);

  if (payload.context) console.log("context:", clean(payload.context));
  if (payload.input) console.log("input:", clean(payload.input));
  if (payload.result) console.log("result:", clean(payload.result));
  if (payload.error) console.log("error:", payload.error);

  if (payload.timing) console.log("timing:", payload.timing);

  if (payload.stats) console.log("stats:", payload.stats);
  if (payload.metrics) console.log("metrics:", payload.metrics);
  if (payload.meta) console.log("meta:", payload.meta);

  if (payload.flow) console.log("flow:", payload.flow);
  if (payload.decision) console.log("decision:", payload.decision);

  if (payload.interaction)
    console.log("interaction:", payload.interaction);

  console.groupEnd();
}