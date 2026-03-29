// =====================================
// 📁 src/core/logger/log.ts
// =====================================

import { TraceContext } from "../trace/TraceContext";

// =====================================
// 🔹 TYPES
// =====================================

type LogLevel = "info" | "warn" | "error";

export type LogPayload = {
  scope?: string;
  event: string;
  traceId?: string;

  level?: LogLevel;

  // 🔹 STANDARD FIELDS
  context?: Record<string, unknown>;
  input?: Record<string, unknown>;
  result?: Record<string, unknown>;
  stats?: Record<string, number>;
  meta?: Record<string, unknown>;

  // 🔥 OBSERVABILITY
  metrics?: {
    increment?: string;
    value?: number;
    [key: string]: unknown;
  };

  timing?: {
    label: string;
    durationMs: number;
  };

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
// 🔻 LOW LEVEL LOGGER (INTERNAL)
// =====================================

function emit(payload: LogPayload | string): void {
  // 🔒 GUARD
  if (!payload) {
    console.log("LOGGER_ERROR: empty payload");
    return;
  }

  // 🔹 SHORT VERSION → NORMALIZE
  if (typeof payload === "string") {
    payload = { event: payload };
  }

  const {
    scope,
    event,
    traceId,
    level = "info",
    context,
    input,
    result,
    stats,
    meta,
    metrics,
    timing,
    error,
  } = payload;

  // ❗ HARD REQUIREMENT
  if (!event) {
    console.log("LOGGER_ERROR: missing event", payload);
    return;
  }

  const time = new Date().toISOString();
  const normalizedError = normalizeError(error);

  console.log(
    `${time} | ${level.toUpperCase()} | ${traceId || "-"} | ${scope || "-"} | ${event}`,
    {
      ...(context && { context }),
      ...(input && { input }),
      ...(result && { result }),
      ...(stats && { stats }),
      ...(meta && { meta }),
      ...(metrics && { metrics }),
      ...(timing && { timing }),
      ...(normalizedError && { error: normalizedError }),
    }
  );
}

// =====================================
// 🔥 HIGH LEVEL LOGGER (MAIN API)
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
    scope: payload.scope ?? ctx.system,
    context: {
      ...ctx,
      ...(payload.context || {}),
    },
  });
}

// =====================================
// 🔥 SHORTCUTS
// =====================================

log.warn = function (
  ctx: TraceContext,
  event: string,
  payload: Omit<LogPayload, "event" | "traceId" | "level"> = {}
) {
  log(ctx, event, { ...payload, level: "warn" });
};

log.error = function (
  ctx: TraceContext,
  event: string,
  error: unknown,
  payload: Omit<LogPayload, "event" | "traceId" | "error" | "level"> = {}
) {
  log(ctx, event, { ...payload, level: "error", error });
};

// =====================================
// 🔥 CTX LOGGER (ULTRA SHORT API)
// =====================================

type CtxLogger = {
  event: (event: string, context?: Record<string, unknown>) => void;
  warn: (event: string, context?: Record<string, unknown>) => void;
  error: (event: string, error: unknown, context?: Record<string, unknown>) => void;
};

log.ctx = function (ctx: TraceContext): CtxLogger {
  return {
    event(event, context = {}) {
      log(ctx, event, { context });
    },

    warn(event, context = {}) {
      log(ctx, event, { level: "warn", context });
    },

    error(event, error, context = {}) {
      log(ctx, event, { level: "error", error, context });
    },
  };
};

// =====================================
// 🔥 BACKWARD COMPAT (OPTIONAL)
// =====================================

export const logger = {
  emit,
};