// =====================================
// 📁 src/core/logger/formatter.ts
// =====================================

import type { LogPayload } from "./log";

// =====================================
// 🎨 ANSI COLORS
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

function getLevelColor(level: string) {
  switch (level) {
    case "fatal":
    case "error":
      return COLORS.red;
    case "warn":
      return COLORS.yellow;
    case "info":
      return COLORS.green;
    case "debug":
    default:
      return COLORS.gray;
  }
}

// =====================================
// 🧠 HELPERS
// =====================================

function clean<T>(obj: T): T | undefined {
  if (!obj || typeof obj !== "object") return obj;

  const entries = Object.entries(obj).filter(
    ([, v]) => v !== undefined && v !== null
  );

  if (entries.length === 0) return undefined;

  return Object.fromEntries(entries) as T;
}

function shortId(id?: string) {
  if (!id) return "-";
  const parts = id.split("-");
  return parts[1]?.slice(0, 4) ?? id;
}

// =====================================
// 🎯 MAIN FORMATTER
// =====================================

export function formatLog(payload: LogPayload) {
  try {
    const level = payload.level ?? "info";
    const color = getLevelColor(level);

    const time = payload.timestamp ?? new Date().toISOString();
    const scope = payload.scope ?? "unknown";
    const eventType = payload.eventType ? `[${payload.eventType}] ` : "";

    const header =
      `${COLORS.dim}${time}${COLORS.reset} ` +
      `${color}[${level.toUpperCase()}]${COLORS.reset} ` +
      `${COLORS.cyan}[${scope}]${COLORS.reset} ` +
      `${eventType}${payload.event} ` +
      `${COLORS.gray}(t-${shortId(payload.traceId)})${COLORS.reset}`;

    console.group(header);

    if (payload.context) console.log("context:", clean(payload.context));
    if (payload.input) console.log("input:", clean(payload.input));
    if (payload.result) console.log("result:", clean(payload.result));
    if (payload.error) console.log("error:", payload.error);
    if (payload.timing) console.log("timing:", payload.timing);

    if (payload.stats) console.log("stats:", payload.stats);
    if (payload.metrics) console.log("metrics:", payload.metrics);

    if (payload.meta) console.log("meta:", payload.meta);
    if (payload.environment) console.log("environment:", payload.environment);
    if (payload.external) console.log("external:", payload.external);
    if (payload.retry) console.log("retry:", payload.retry);
    if (payload.cache) console.log("cache:", payload.cache);
    if (payload.connection) console.log("connection:", payload.connection);
    if (payload.rateLimit) console.log("rateLimit:", payload.rateLimit);
    if (payload.security) console.log("security:", payload.security);

    if (payload.flow) console.log("flow:", payload.flow);
    if (payload.relations) console.log("relations:", payload.relations);
    if (payload.transaction) console.log("transaction:", payload.transaction);
    if (payload.state) console.log("state:", payload.state);
    if (payload.decision) console.log("decision:", payload.decision);
    if (payload.span) console.log("span:", payload.span);

    if (payload.performance) console.log("performance:", payload.performance);
    if (payload.dataFlow) console.log("dataFlow:", payload.dataFlow);

    if (payload.interaction) console.log("interaction:", payload.interaction);
    if (payload.attachment) console.log("attachment:", payload.attachment);

    if (payload.job) console.log("job:", payload.job);

    if (payload.tags) console.log("tags:", payload.tags);
    if (payload.debug) console.log("debug:", payload.debug);

    console.groupEnd();
  } catch (err) {
    console.log("LOGGER_FORMAT_ERROR", err, payload);
  }
}