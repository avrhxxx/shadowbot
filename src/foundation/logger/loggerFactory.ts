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
// 🧠 FLOW LOGGER
// =====================================

type LogInput = Partial<LogPayload>;

function createFlowLogger(
  ctx: TraceContext | undefined,
  systemName: string,
  flowName: string
) {
  function emit(
    level: LogLevel,
    event: string,
    payload?: LogInput,
    error?: unknown
  ) {
    baseLogger[level]({
      event,

      // 🔥 CONTEXT
      traceId: ctx?.traceId,
      correlationId: ctx?.correlationId,
      flowId: ctx?.flowId,
      system: systemName,

      // 🔥 FLOW META
      flow: {
        step: event,
      },

      ...(payload ?? {}),

      error: normalizeError(error ?? payload?.error),
    });
  }

  return {
    // =====================================
    // 🔹 FLOW LIFECYCLE
    // =====================================

    start: () => emit("info", `${flowName}.start`),

    success: () => emit("info", `${flowName}.success`),

    fail: (err?: unknown) =>
      emit("error", `${flowName}.fail`, undefined, err),

    // =====================================
    // 🔹 STEPS
    // =====================================

    stepDebug: (step: string, payload?: LogInput) =>
      emit("debug", `${flowName}.${step}`, payload),

    stepInfo: (step: string, payload?: LogInput) =>
      emit("info", `${flowName}.${step}`, payload),

    stepWarn: (step: string, payload?: LogInput) =>
      emit("warn", `${flowName}.${step}`, payload),

    stepError: (step: string, err?: unknown, payload?: LogInput) =>
      emit("error", `${flowName}.${step}`, payload, err),

    // =====================================
    // 🔹 EVENT (opcjonalny override)
    // =====================================

    event: (eventName: string) => ({
      debug: (payload?: LogInput) =>
        emit("debug", eventName, payload),

      info: (payload?: LogInput) =>
        emit("info", eventName, payload),

      warn: (payload?: LogInput) =>
        emit("warn", eventName, payload),

      error: (err?: unknown, payload?: LogInput) =>
        emit("error", eventName, payload, err),
    }),
  };
}

// =====================================
// 🏭 FACTORY (LEVEL 2 LOGGER)
// =====================================

export function createLogger(ctx?: TraceContext) {
  return {
    system(systemName: string) {
      return {
        flow(flowName: string) {
          return createFlowLogger(ctx, systemName, flowName);
        },
      };
    },
  };
}