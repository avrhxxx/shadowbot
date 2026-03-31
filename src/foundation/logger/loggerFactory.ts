// =====================================
// 📁 src/foundation/logger/loggerFactory.ts
// =====================================

import { baseLogger } from "./loggerCore";
import type { LogPayload, LogLevel } from "./loggerTypes";
import type { TraceContext } from "@/trace";

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

  return { message: String(err) };
}

function resolveScope(ctx?: TraceContext, payload?: any): string {
  if (payload?.meta?.system) return `SYSTEM:${payload.meta.system}`;
  if (ctx?.system) return `SYSTEM:${ctx.system}`;
  return "APP";
}

function simplifyEvent(event: string): string {
  const parts = event.split(".");
  return parts[parts.length - 1];
}

function buildMessage(
  ctx: TraceContext | undefined,
  event: string,
  payload?: any
): string {
  const scope = resolveScope(ctx, payload);

  const base = `[${scope}] ${simplifyEvent(event)}`;

  const ids = [
    ctx?.traceId && `trace=${ctx.traceId}`,
    ctx?.flowId && `flow=${ctx.flowId}`,
    ctx?.correlationId && `corr=${ctx.correlationId}`,
  ]
    .filter(Boolean)
    .join(" ");

  return ids ? `${base} | ${ids}` : base;
}

// =====================================
// 🏭 FACTORY
// =====================================

type LogInput = Omit<LogPayload, "event" | "level">;

export function createLogger(ctx?: TraceContext) {
  function log(
    level: LogLevel,
    event: string,
    payload?: LogInput
  ) {
    baseLogger[level](
      {
        event,
        traceId: ctx?.traceId,
        correlationId: ctx?.correlationId,
        flowId: ctx?.flowId,

        ...(payload ?? {}),
        error: normalizeError(payload?.error),
      },
      buildMessage(ctx, event, payload) // 🔥 KLUCZ
    );
  }

  return {
    debug: (event: string, payload?: LogInput) =>
      log("debug", event, payload),

    info: (event: string, payload?: LogInput) =>
      log("info", event, payload),

    warn: (event: string, payload?: LogInput) =>
      log("warn", event, payload),

    error: (event: string, error?: unknown, payload?: LogInput) =>
      log("error", event, { ...(payload ?? {}), error }),

    fatal: (event: string, error?: unknown, payload?: LogInput) =>
      log("fatal", event, { ...(payload ?? {}), error }),
  };
}