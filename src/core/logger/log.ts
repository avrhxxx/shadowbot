// =====================================
// 📁 src/core/logger/log.ts
// =====================================

import type { TraceContext } from "../trace/TraceContext.js";
import { formatLog } from "./formatter.js";

// =====================================
// 🔹 TYPES
// =====================================

type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export type LogPayload = {
  scope?: string;
  event: string;
  traceId?: string;

  level?: LogLevel;

  eventType?:
    | "system"
    | "user"
    | "interaction"
    | "external"
    | "job"
    | "security"
    | "performance"
    | "debug";

  timestamp?: string;
  schemaVersion?: number;

  context?: Record<string, unknown>;
  input?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: unknown;

  timing?: {
    label: string;
    durationMs: number;
  };

  stats?: Record<string, number>;
  metrics?: Record<string, unknown>;
  meta?: Record<string, unknown>;

  flow?: {
    step?: string;
  };

  decision?: {
    condition: string;
    result: boolean;
  };

  interaction?: {
    type?: string;
    name?: string;
    customId?: string;
  };
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

function emit(input: LogPayload): void {
  const payload: LogPayload = {
    ...input,
    timestamp: input.timestamp ?? new Date().toISOString(),
    error: normalizeError(input.error),
  };

  formatLog(payload);
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
    schemaVersion: payload.schemaVersion ?? 1,
    context: {
      ...(payload.context || {}),
      trace: ctx,
    },
  });
}

// =====================================
// 🔥 SHORTCUTS
// =====================================

log.debug = (ctx: TraceContext, event: string, payload = {}) =>
  log(ctx, event, { ...payload, level: "debug" });

log.info = (ctx: TraceContext, event: string, payload = {}) =>
  log(ctx, event, { ...payload, level: "info" });

log.warn = (ctx: TraceContext, event: string, payload = {}) =>
  log(ctx, event, { ...payload, level: "warn" });

log.error = (
  ctx: TraceContext,
  event: string,
  error: unknown,
  payload = {}
) =>
  log(ctx, event, { ...payload, level: "error", error });

log.fatal = (
  ctx: TraceContext,
  event: string,
  error: unknown,
  payload = {}
) =>
  log(ctx, event, { ...payload, level: "fatal", error });

// =====================================
// 🔥 CTX LOGGER (STANDARD)
// =====================================

log.ctx = function (ctx: TraceContext) {
  return {
    event: (event: string, payload = {}) => log(ctx, event, payload),
    debug: (event: string, payload = {}) =>
      log(ctx, event, { ...payload, level: "debug" }),
    info: (event: string, payload = {}) =>
      log(ctx, event, { ...payload, level: "info" }),
    warn: (event: string, payload = {}) =>
      log(ctx, event, { ...payload, level: "warn" }),
    error: (event: string, error: unknown, payload = {}) =>
      log(ctx, event, { ...payload, level: "error", error }),
    fatal: (event: string, error: unknown, payload = {}) =>
      log(ctx, event, { ...payload, level: "fatal", error }),
  };
};