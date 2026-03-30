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

  // =============================
  // 🧠 CORE
  // =============================

  context?: Record<string, unknown>;
  input?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: unknown;

  timing?: {
    label: string;
    durationMs: number;
  };

  // =============================
  // 📊 ANALYTICS
  // =============================

  stats?: Record<string, number>;

  metrics?: {
    increment?: string;
    value?: number;
    unit?: string;
    tags?: Record<string, string>;
  };

  // =============================
  // ⚙️ SYSTEM / INFRA
  // =============================

  meta?: Record<string, unknown>;

  environment?: {
    service?: string;
    version?: string;
    env?: "dev" | "prod" | "test";
  };

  external?: {
    service: string;
    action?: string;
    status?: number;
  };

  retry?: {
    attempt: number;
    max?: number;
  };

  cache?: {
    hit: boolean;
    key?: string;
  };

  // =============================
  // 🔗 FLOW / ARCHITEKTURA
  // =============================

  flow?: {
    step?: string;
    parent?: string;
    chain?: string[];
  };

  relations?: {
    calls?: string[];
    calledBy?: string;
  };

  transaction?: {
    id: string;
    type?: string;
  };

  state?: {
    from?: string;
    to?: string;
  };

  decision?: {
    condition: string;
    result: boolean;
  };

  // =============================
  // ⚡ PERFORMANCE
  // =============================

  performance?: {
    memoryUsage?: number;
    cpuUsage?: number;
  };

  dataFlow?: {
    inputSize?: number;
    outputSize?: number;
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
// 🔻 LOW LEVEL LOGGER (INTERNAL)
// =====================================

function emit(payload: LogPayload | string): void {
  if (!payload) {
    console.log("LOGGER_ERROR: empty payload");
    return;
  }

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

    environment,
    external,
    retry,
    cache,

    flow,
    relations,
    transaction,
    state,
    decision,

    performance,
    dataFlow,
  } = payload;

  if (!event) {
    console.log("LOGGER_ERROR: missing event", payload);
    return;
  }

  const time = new Date().toISOString();
  const normalizedError = normalizeError(error);

  console.log(
    `${time} | ${level.toUpperCase()} | ${traceId || "-"} | ${scope || "unknown"} | ${event}`,
    {
      ...(context && { context }),
      ...(input && { input }),
      ...(result && { result }),
      ...(stats && { stats }),
      ...(meta && { meta }),
      ...(metrics && { metrics }),
      ...(timing && { timing }),
      ...(environment && { environment }),
      ...(external && { external }),
      ...(retry && { retry }),
      ...(cache && { cache }),
      ...(flow && { flow }),
      ...(relations && { relations }),
      ...(transaction && { transaction }),
      ...(state && { state }),
      ...(decision && { decision }),
      ...(performance && { performance }),
      ...(dataFlow && { dataFlow }),
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
    scope: payload.scope ?? ctx.system ?? "unknown",

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
  event: (event: string, payload?: Omit<LogPayload, "event" | "traceId">) => void;
  warn: (event: string, payload?: Omit<LogPayload, "event" | "traceId" | "level">) => void;
  error: (event: string, error: unknown, payload?: Omit<LogPayload, "event" | "traceId" | "error" | "level">) => void;
};

log.ctx = function (ctx: TraceContext): CtxLogger {
  return {
    event(event, payload = {}) {
      log(ctx, event, payload);
    },

    warn(event, payload = {}) {
      log(ctx, event, { ...payload, level: "warn" });
    },

    error(event, error, payload = {}) {
      log(ctx, event, { ...payload, level: "error", error });
    },
  };
};