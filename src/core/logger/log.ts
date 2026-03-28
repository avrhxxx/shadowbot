// =====================================
// 📁 src/core/logger/log.ts
// =====================================

import { TraceContext } from "../trace/TraceContext";

// =====================================
// 🔹 TYPES
// =====================================

type LogLevel = "info" | "warn" | "error";

export type LogPayload = {
  context?: Record<string, unknown>;
  input?: Record<string, unknown>;
  result?: Record<string, unknown>;
  stats?: Record<string, number>;
  meta?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
    [key: string]: unknown;
  };
};

// =====================================
// 🔥 LOGGER
// =====================================

export function log(
  ctx: TraceContext,
  event: string,
  payload?: LogPayload,
  level: LogLevel = "info"
) {
  const time = new Date().toISOString();

  console.log(
    `${time} | ${ctx.traceId} | ${level.toUpperCase()} | ${event}`,
    payload || ""
  );
}