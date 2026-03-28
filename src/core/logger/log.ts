// =====================================
// 📁 src/core/logger/log.ts
// =====================================

import { TraceContext } from "../trace/TraceContext";

// =====================================
// 🔹 TYPES
// =====================================

type LogLevel = "info" | "warn" | "error";

export type LogPayload = {
  traceId?: string;

  context?: Record<string, unknown>;
  input?: Record<string, unknown>;
  result?: Record<string, unknown>;
  stats?: Record<string, number>;
  meta?: Record<string, unknown>;

  data?: unknown; // 🔥 uniwersalne pole (NOWE)

  error?: {
    message?: string;
    stack?: string;
    [key: string]: unknown;
  };

  level?: LogLevel;
};

// =====================================
// 🔧 FORMATTER
// =====================================

function formatLog(
  traceId: string | undefined,
  event: string,
  payload?: LogPayload,
  level: LogLevel = "info"
) {
  const time = new Date().toISOString();

  return [
    `${time} | ${traceId ?? "no-trace"} | ${level.toUpperCase()} | ${event}`,
    payload ?? ""
  ] as const;
}

// =====================================
// 🔥 BASE LOGGER (BACKWARD COMPAT)
// =====================================

export function log(
  ctx: TraceContext,
  event: string,
  payload?: LogPayload,
  level: LogLevel = "info"
) {
  const [header, body] = formatLog(ctx.traceId, event, payload, level);
  console.log(header, body);
}

// =====================================
// 🚀 MODERN LOGGER (NEW API)
// =====================================

export const logger = {
  emit(event: string, payload?: LogPayload) {
    const [header, body] = formatLog(
      payload?.traceId,
      event,
      payload,
      payload?.level ?? "info"
    );
    console.log(header, body);
  },

  error(event: string, payload?: LogPayload) {
    const [header, body] = formatLog(
      payload?.traceId,
      event,
      payload,
      "error"
    );
    console.log(header, body);
  },

  warn(event: string, payload?: LogPayload) {
    const [header, body] = formatLog(
      payload?.traceId,
      event,
      payload,
      "warn"
    );
    console.log(header, body);
  }
};