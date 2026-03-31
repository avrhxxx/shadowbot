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
    baseLogger[level]({
      event,

      // 🔥 CONTEXT
      traceId: ctx?.traceId,
      correlationId: ctx?.correlationId,
      flowId: ctx?.flowId,
      system: ctx?.system,

      // 🔥 PAYLOAD
      ...(payload ?? {}),

      // 🔥 ERROR NORMALIZATION
      error: normalizeError(payload?.error),
    });
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