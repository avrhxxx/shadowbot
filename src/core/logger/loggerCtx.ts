// =====================================
// 📁 src/core/logger/loggerCtx.ts
// =====================================

import type { TraceContext } from "../trace/traceTypes.js";
import type { LogPayload } from "./loggerTypes.js";
import { loggerEmit } from "./loggerEmit.js";

// =====================================
// 🔹 BASE LOG FUNCTION
// =====================================

function baseLog(
  ctx: TraceContext,
  event: string,
  payload: Omit<LogPayload, "event" | "traceId"> = {}
) {
  loggerEmit({
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
// 🔥 CTX LOGGER FACTORY (B3 CORE)
// =====================================

export function createLoggerCtx(ctx: TraceContext) {
  return {
    // 🔹 base
    event: (event: string, payload?: Omit<LogPayload, "event">) =>
      baseLog(ctx, event, payload),

    // 🔹 levels
    debug: (event: string, payload?: Omit<LogPayload, "event">) =>
      baseLog(ctx, event, { ...payload, level: "debug" }),

    info: (event: string, payload?: Omit<LogPayload, "event">) =>
      baseLog(ctx, event, { ...payload, level: "info" }),

    warn: (event: string, payload?: Omit<LogPayload, "event">) =>
      baseLog(ctx, event, { ...payload, level: "warn" }),

    error: (
      event: string,
      error: unknown,
      payload?: Omit<LogPayload, "event" | "error">
    ) =>
      baseLog(ctx, event, {
        ...payload,
        level: "error",
        error,
      }),

    fatal: (
      event: string,
      error: unknown,
      payload?: Omit<LogPayload, "event" | "error">
    ) =>
      baseLog(ctx, event, {
        ...payload,
        level: "fatal",
        error,
      }),
  };
}