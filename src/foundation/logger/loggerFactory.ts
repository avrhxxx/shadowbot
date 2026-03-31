// =====================================
// 📁 src/foundation/logger/loggerFactory.ts
// =====================================

/**
 * 🧠 ROLE:
 * Creates context-aware logger
 *
 * 📥 INPUT:
 * - optional TraceContext
 *
 * 📤 OUTPUT:
 * - simple logging API (debug/info/warn/error/fatal)
 *
 * ❗ GOAL:
 * - minimal usage in code
 * - future-proof payload
 */

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

// =====================================
// 🏭 FACTORY
// =====================================

export function createLogger(ctx?: TraceContext) {
  function log(
    level: LogLevel,
    event: string,
    payload?: LogPayload
  ) {
    baseLogger[level]({
      event,
      level,
      traceId: ctx?.traceId,
      correlationId: ctx?.correlationId,
      flowId: ctx?.flowId,

      ...(payload ?? {}),
      error: normalizeError(payload?.error),
    });
  }

  return {
    debug: (event: string, payload?: LogPayload) =>
      log("debug", event, payload),

    info: (event: string, payload?: LogPayload) =>
      log("info", event, payload),

    warn: (event: string, payload?: LogPayload) =>
      log("warn", event, payload),

    error: (event: string, error?: unknown, payload?: LogPayload) =>
      log("error", event, { ...(payload ?? {}), error }),

    fatal: (event: string, error?: unknown, payload?: LogPayload) =>
      log("fatal", event, { ...(payload ?? {}), error }),
  };
}