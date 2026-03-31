// =====================================
// 📁 src/core/logger/loggerCtx.ts
// =====================================

import type { TraceContext } from "../trace/traceTypes.js";
import type { LogPayload } from "./loggerTypes.js";
import { loggerEmit } from "./loggerEmit.js";

// =====================================
// 🔧 HELPERS
// =====================================

function safePayload(
  payload?: Omit<LogPayload, "event" | "traceId">
): Omit<LogPayload, "event" | "traceId"> {
  return payload ?? {};
}

// =====================================
// 🔹 BASE LOG FUNCTION
// =====================================

function baseLog(
  ctx: TraceContext,
  event: string,
  payload?: Omit<LogPayload, "event" | "traceId">
) {
  const p = safePayload(payload);

  loggerEmit({
    ...p,

    // 🔹 identity
    event,
    traceId: ctx.traceId,
    scope: p.scope ?? ctx.system ?? "unknown",

    // 🔹 meta
    schemaVersion: p.schemaVersion ?? 1,

    // 🔹 structured
    trace: ctx,

    context: {
      ...(p.context || {}),
    },
  });
}

// =====================================
// 🔥 CTX LOGGER FACTORY (B3 CORE)
// =====================================

export function createLoggerCtx(ctx: TraceContext) {
  return {
    // 🔹 base
    event: (event: string, payload?: Omit<LogPayload, "event">) =>
      baseLog(ctx, event, payload),

    // 🔹 levels
    debug: (event: string, payload?: Omit<LogPayload, "event">) =>
      baseLog(ctx, event, {
        ...safePayload(payload),
        level: "debug",
      }),

    info: (event: string, payload?: Omit<LogPayload, "event">) =>
      baseLog(ctx, event, {
        ...safePayload(payload),
        level: "info",
      }),

    warn: (event: string, payload?: Omit<LogPayload, "event">) =>
      baseLog(ctx, event, {
        ...safePayload(payload),
        level: "warn",
      }),

    error: (
      event: string,
      error: unknown,
      payload?: Omit<LogPayload, "event" | "error">
    ) =>
      baseLog(ctx, event, {
        ...safePayload(payload),
        level: "error",
        error,
      }),

    fatal: (
      event: string,
      error: unknown,
      payload?: Omit<LogPayload, "event" | "error">
    ) =>
      baseLog(ctx, event, {
        ...safePayload(payload),
        level: "fatal",
        error,
      }),
  };
}