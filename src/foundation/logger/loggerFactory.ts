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
// 🔹 TYPES (🔥 KLUCZOWE)
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

type SystemLogger = {
  debug(event: string, payload?: LogInput): void;
  info(event: string, payload?: LogInput): void;
  warn(event: string, payload?: LogInput): void;
  error(event: string, error?: unknown, payload?: LogInput): void;
  fatal(event: string, error?: unknown, payload?: LogInput): void;

  flow(flowName: string): FlowLogger;
};

type Logger = {
  debug(event: string, payload?: LogInput): void;
  info(event: string, payload?: LogInput): void;
  warn(event: string, payload?: LogInput): void;
  error(event: string, error?: unknown, payload?: LogInput): void;
  fatal(event: string, error?: unknown, payload?: LogInput): void;

  system(systemName: string): SystemLogger;
};

// =====================================
// 🏭 FACTORY
// =====================================

export function createLogger(ctx?: TraceContext): Logger {
  function baseLog(
    level: LogLevel,
    event: string,
    payload?: LogInput,
    overrideSystem?: string
  ) {
    baseLogger[level]({
      event,

      // 🔥 CONTEXT
      traceId: ctx?.traceId,
      correlationId: ctx?.correlationId,
      flowId: ctx?.flowId,

      // 🔥 SYSTEM (scope)
      system: overrideSystem ?? ctx?.system ?? "app",

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

  function withSystem(systemName: string): SystemLogger {
    return {
      debug: (event: string, payload?: LogInput) =>
        baseLog("debug", event, payload, systemName),

      info: (event: string, payload?: LogInput) =>
        baseLog("info", event, payload, systemName),

      warn: (event: string, payload?: LogInput) =>
        baseLog("warn", event, payload, systemName),

      error: (event: string, error?: unknown, payload?: LogInput) =>
        baseLog("error", event, { ...(payload ?? {}), error }, systemName),

      fatal: (event: string, error?: unknown, payload?: LogInput) =>
        baseLog("fatal", event, { ...(payload ?? {}), error }, systemName),

      flow(flowName: string): FlowLogger {
        const base = flowName;

        return {
          start: (payload?: LogInput) =>
            baseLog("info", `${base}.start`, payload, systemName),

          stepDebug: (step: string, payload?: LogInput) =>
            baseLog(
              "debug",
              `${base}.${step}`,
              { ...payload, flow: { step } },
              systemName
            ),

          stepInfo: (step: string, payload?: LogInput) =>
            baseLog(
              "info",
              `${base}.${step}`,
              { ...payload, flow: { step } },
              systemName
            ),

          stepWarn: (step: string, payload?: LogInput) =>
            baseLog(
              "warn",
              `${base}.${step}`,
              { ...payload, flow: { step } },
              systemName
            ),

          stepError: (step: string, error?: unknown, payload?: LogInput) =>
            baseLog(
              "error",
              `${base}.${step}`,
              { ...payload, flow: { step }, error },
              systemName
            ),

          success: (payload?: LogInput) =>
            baseLog("info", `${base}.success`, payload, systemName),

          fail: (error?: unknown, payload?: LogInput) =>
            baseLog(
              "error",
              `${base}.fail`,
              { ...(payload ?? {}), error },
              systemName
            ),
        };
      },
    };
  }

  return {
    ...raw,
    system: withSystem,
  };
}