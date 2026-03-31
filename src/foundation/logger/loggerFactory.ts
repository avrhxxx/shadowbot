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
// 🔹 TYPES
// =====================================

type LogInput = Partial<LogPayload>;

type FlowLogger = {
  start(payload?: LogInput): void;
  stepDebug(step: string, payload?: LogInput): void;
  stepInfo(step: string, payload?: LogInput): void;
  stepWarn(step: string, payload?: LogInput): void;
  stepError(step: string, error?: unknown, payload?: LogInput): void;
  success(payload?: LogInput): void;
  fail(error?: unknown, payload?: LogInput): void;
};

type Logger = {
  debug(event: string, payload?: LogInput): void;
  info(event: string, payload?: LogInput): void;
  warn(event: string, payload?: LogInput): void;
  error(event: string, error?: unknown, payload?: LogInput): void;
  fatal(event: string, error?: unknown, payload?: LogInput): void;

  flow(flowName: string): FlowLogger;
};

// =====================================
// 🏭 FACTORY
// =====================================

export function createLogger(ctx?: TraceContext): Logger {
  function baseLog(
    level: LogLevel,
    event: string,
    payload?: LogInput
  ) {
    baseLogger[level]({
      event,

      // 🔥 TRACE (SOURCE OF TRUTH)
      traceId: ctx?.traceId,
      correlationId: ctx?.correlationId,
      flowId: ctx?.flowId,
      system: ctx?.system ?? "app",

      // 🔥 PAYLOAD
      ...(payload ?? {}),

      // 🔥 ERROR
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

  function flow(flowName: string): FlowLogger {
    const base = flowName;

    return {
      start: (payload?: LogInput) =>
        baseLog("info", `${base}.start`, payload),

      stepDebug: (step: string, payload?: LogInput) =>
        baseLog("debug", `${base}.${step}`, {
          ...payload,
          flow: { step },
        }),

      stepInfo: (step: string, payload?: LogInput) =>
        baseLog("info", `${base}.${step}`, {
          ...payload,
          flow: { step },
        }),

      stepWarn: (step: string, payload?: LogInput) =>
        baseLog("warn", `${base}.${step}`, {
          ...payload,
          flow: { step },
        }),

      stepError: (step: string, error?: unknown, payload?: LogInput) =>
        baseLog("error", `${base}.${step}`, {
          ...payload,
          flow: { step },
          error,
        }),

      success: (payload?: LogInput) =>
        baseLog("info", `${base}.success`, payload),

      fail: (error?: unknown, payload?: LogInput) =>
        baseLog("error", `${base}.fail`, {
          ...(payload ?? {}),
          error,
        }),
    };
  }

  return {
    ...raw,
    flow,
  };
}