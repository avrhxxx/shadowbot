// =====================================
// 📁 src/core/logger/log.ts
// =====================================

import { TraceContext } from "../trace/TraceContext";
import { formatLog } from "./formatter";

// =====================================
// 🔹 TYPES
// =====================================

type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export const EVENT_TYPES = {
  system: "system",
  user: "user",
  interaction: "interaction",
  external: "external",
  job: "job",
  security: "security",
  performance: "performance",
  debug: "debug",
} as const;

export type LogPayload = {
  scope?: string;
  event: string;
  traceId?: string;

  level?: LogLevel;

  eventType?: keyof typeof EVENT_TYPES;

  timestamp?: string;
  schemaVersion?: number;

  context?: Record<string, unknown>;
  input?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: unknown;
};

// =====================================
// 🔧 HELPERS
// =====================================

function normalizeError(err: unknown) {
  if (!err) return undefined;

  if (err instanceof Error) {
    return {
      message: err.message,
      stack: err.stack,
    };
  }

  return {
    message: String(err),
  };
}

// =====================================
// 🔻 INTERNAL LOGGER
// =====================================

function emit(payload: LogPayload | string): void {
  if (!payload) {
    console.log("LOGGER_ERROR: empty payload");
    return;
  }

  if (typeof payload === "string") {
    payload = { event: payload };
  }

  if (!payload.event) {
    console.log("LOGGER_ERROR: missing event", payload);
    return;
  }

  formatLog({
    ...payload,
    timestamp: payload.timestamp ?? new Date().toISOString(),
    error: normalizeError(payload.error),
    eventType: payload.eventType ?? "system",
    schemaVersion: payload.schemaVersion ?? 1,
  });
}

// =====================================
// 🔥 MAIN API
// =====================================

export function log(
  ctx: TraceContext,
  event: string,
  payload: Omit<LogPayload, "event" | "traceId"> = {}
) {
  emit({
    ...payload,
    event,
    traceId: ctx.traceId,
    scope: payload.scope ?? ctx.system ?? "unknown",

    context: {
      ...(payload.context || {}),
      ...ctx,
    },
  });
}

// =====================================
// 🔥 SHORTCUTS
// =====================================

log.warn = (ctx: TraceContext, event: string, payload = {}) =>
  log(ctx, event, { ...payload, level: "warn" });

log.error = (ctx: TraceContext, event: string, error: unknown, payload = {}) =>
  log(ctx, event, { ...payload, level: "error", error });

// =====================================
// 🔥 CTX LOGGER
// =====================================

log.ctx = function (ctx: TraceContext) {
  return {
    event: (event: string, payload = {}) => log(ctx, event, payload),
    warn: (event: string, payload = {}) =>
      log(ctx, event, { ...payload, level: "warn" }),
    error: (event: string, error: unknown, payload = {}) =>
      log(ctx, event, { ...payload, level: "error", error }),
  };
};