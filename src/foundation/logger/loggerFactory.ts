// =====================================
// 📁 src/foundation/logger/loggerFactory.ts
// =====================================

import { baseLogger } from "./loggerCore";
import { createFlowLogger } from "./helpers/flowLogger";

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

type LogInput = Partial<LogPayload>;

export function createLogger(ctx?: TraceContext) {
  function baseLog(
    level: LogLevel,
    event: string,
    payload?: LogInput
  ) {
    baseLogger[level]({
      event,

      traceId: ctx?.traceId,
      correlationId: ctx?.correlationId,
      flowId: ctx?.flowId,

      system: ctx?.system,
      scope: ctx?.source, // 🔥 KLUCZ

      ...(payload ?? {}),

      error: normalizeError(payload?.error),
    });
  }

  const raw = {
    debug: (event: string, payload?: LogInput) =>
      baseLog("debug", event, payload),

    info: (event: string, payload?: LogInput) =>
      baseLog("info", event, payload),

    warn: (event: string, payload?: LogInput) =>
      baseLog("warn", event, payload),

    error: (event: string, error?: unknown, payload?: LogInput) =>
      baseLog("error", event, { ...(payload ?? {}), error }),

    fatal: (event: string, error?: unknown, payload?: LogInput) =>
      baseLog("fatal", event, { ...(payload ?? {}), error }),
  };

  return {
    ...raw,

    system(systemName: string) {
      return {
        flow(flowName: string) {
          return createFlowLogger(raw, systemName, flowName);
        },
      };
    },
  };
}