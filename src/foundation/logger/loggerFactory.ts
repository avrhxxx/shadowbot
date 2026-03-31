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

type LogInput = Partial<LogPayload>;

export function createLogger(ctx?: TraceContext) {
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

      // 🔥 SCOPE (KLUCZOWE)
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

  // =====================================
  // 🔥 SYSTEM SCOPING (WRACA)
  // =====================================

  function withSystem(systemName: string) {
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

      flow(flowName: string) {
        const base = `${flowName}`;

        return {
          start: (payload?: LogInput) =>
            baseLog("info", `${base}.start`, payload, systemName),

          stepDebug: (step: string, payload?: LogInput) =>
            baseLog("debug", `${base}.${step}`, {
              ...payload,
              flow: { step },
            }, systemName),

          stepInfo: (step: string, payload?: LogInput) =>
            baseLog("info", `${base}.${step}`, {
              ...payload,
              flow: { step },
            }, systemName),

          stepWarn: (step: string, payload?: LogInput) =>
            baseLog("warn", `${base}.${step}`, {
              ...payload,
              flow: { step },
            }, systemName),

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
            baseLog("error", `${base}.fail`, { ...(payload ?? {}), error }, systemName),
        };
      },
    };
  }

  return {
    ...raw,
    system: withSystem,
  };
}