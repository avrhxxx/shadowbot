// =====================================
// 📁 src/core/logger/log.ts
// =====================================

import { TraceContext } from "../trace/TraceContext";

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

  connection?: {
    service: string;
    status: "connected" | "disconnected" | "degraded";
    latencyMs?: number;
    attempt?: number;
    endpoint?: string;
    protocol?: string;
  };

  rateLimit?: {
    limit?: number;
    remaining?: number;
    resetMs?: number;
  };

  security?: {
    action?: string;
    allowed?: boolean;
    reason?: string;
  };

  // =============================
  // 🔗 FLOW
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

  span?: {
    id?: string;
    parentId?: string;
    name?: string;
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

  // =============================
  // 🎯 DISCORD
  // =============================

  interaction?: {
    type?: "command" | "button" | "select" | "modal";
    name?: string;
    customId?: string;
  };

  attachment?: {
    url?: string;
    name?: string;
    size?: number;
    contentType?: string;
  };

  // =============================
  // ⚙️ JOBS
  // =============================

  job?: {
    id?: string;
    type?: string;
    status?: "started" | "completed" | "failed";
  };

  // =============================
  // 🏷️ DEBUG
  // =============================

  tags?: string[];
  debug?: Record<string, unknown>;
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

  const time = payload.timestamp ?? new Date().toISOString();
  const normalizedError = normalizeError(payload.error);

  console.log(
    `${time} | ${(payload.level ?? "info").toUpperCase()} | ${payload.traceId || "-"} | ${payload.scope || "unknown"} | ${payload.event}`,
    {
      ...payload,
      ...(normalizedError && { error: normalizedError }),
    }
  );
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
    warn: (event: string, payload = {}) => log(ctx, event, { ...payload, level: "warn" }),
    error: (event: string, error: unknown, payload = {}) =>
      log(ctx, event, { ...payload, level: "error", error }),
  };
};