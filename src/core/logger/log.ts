// =====================================
// 📁 src/core/logger/log.ts
// =====================================

import { TraceContext } from "../trace/TraceContext";

type LogLevel = "info" | "warn" | "error";

type LogPayload = {
  input?: unknown;
  result?: unknown;
  context?: unknown;
  error?: unknown;
};

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