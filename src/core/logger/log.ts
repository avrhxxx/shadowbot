// =====================================
// 📁 src/core/logger/formatter.ts
// =====================================

import type { LogPayload } from "./log";
import { toDisplayTraceId } from "../ids/IdGenerator";

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
    default:
      return COLORS.gray;
  }
}

// =====================================
// 🧠 HELPERS
// =====================================

function clean(obj: any) {
  if (!obj || typeof obj !== "object") return obj;
  const entries = Object.entries(obj).filter(([, v]) => v != null);
  return entries.length ? Object.fromEntries(entries) : undefined;
}

// =====================================
// 🎯 MAIN FORMATTER
// =====================================

export function formatLog(payload: LogPayload) {
  try {
    const level = payload.level ?? "info";
    const color = getLevelColor(level);

    const header =
      `${COLORS.dim}${payload.timestamp}${COLORS.reset} ` +
      `${color}[${level.toUpperCase()}]${COLORS.reset} ` +
      `${COLORS.cyan}[${payload.scope}]${COLORS.reset} ` +
      `${payload.event} ` +
      `${COLORS.gray}(${toDisplayTraceId(payload.traceId as any)})${COLORS.reset}`;

    console.group(header);

    if (payload.context) console.log("context:", clean(payload.context));
    if (payload.input) console.log("input:", clean(payload.input));
    if (payload.result) console.log("result:", clean(payload.result));
    if (payload.error) console.log("error:", payload.error);

    console.groupEnd();
  } catch (err) {
    console.log("LOGGER_FORMAT_ERROR", err, payload);
  }
}