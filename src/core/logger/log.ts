// =====================================
// 📁 src/core/logger/log.ts
// =====================================

import { TraceContext } from "../trace/TraceContext";
import { formatLog } from "./formatter";

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

function emit(payload: LogPayload): void {
  payload.timestamp = payload.timestamp ?? new Date().toISOString();
  payload.error = normalizeError(payload.error);

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