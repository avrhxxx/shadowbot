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
  function emit(
    level: LogLevel,
    event: string,
    payload?: LogInput,
    override?: { system?: string; flowStep?: string }
  ) {
    baseLogger[level]({
      event,

      // CONTEXT
      traceId: ctx?.traceId,
      correlationId: ctx?.correlationId,
      flowId: ctx?.flowId,

      system: override?.system ?? ctx?.system,

      // FLOW STEP
      flow: override?.flowStep
        ? { step: override.flowStep }
        : payload?.flow,

      // PAYLOAD
      ...(payload ?? {}),

      // ERROR
      error: normalizeError(payload?.error),
    });
  }

  // =====================================
  // 🔹 FLOW BUILDER
  // =====================================

  function createFlow(system: string, flowName: string) {
    return {
      start() {
        emit("info", `${flowName}.start`, undefined, {
          system,
        });
      },

      success() {
        emit("info", `${flowName}.success`, undefined, {
          system,
        });
      },

      fail(err?: unknown) {
        emit(
          "error",
          `${flowName}.fail`,
          err ? { error: err } : undefined,
          { system }
        );
      },

      stepInfo(step: string, payload?: LogInput) {
        emit("info", `${flowName}.${step}`, payload, {
          system,
          flowStep: step,
        });
      },

      stepDebug(step: string, payload?: LogInput) {
        emit("debug", `${flowName}.${step}`, payload, {
          system,
          flowStep: step,
        });
      },

      stepError(step: string, err?: unknown, payload?: LogInput) {
        emit(
          "error",
          `${flowName}.${step}`,
          { ...(payload ?? {}), error: err },
          {
            system,
            flowStep: step,
          }
        );
      },
    };
  }

  // =====================================
  // 🔹 SYSTEM BUILDER
  // =====================================

  function system(systemName: string) {
    return {
      flow(flowName: string) {
        return createFlow(systemName, flowName);
      },
    };
  }

  // =====================================
  // 🔹 BASE LOGGER (fallback)
  // =====================================

  function log(level: LogLevel, event: string, payload?: LogInput) {
    emit(level, event, payload);
  }

  return {
    // 🔥 LEVEL 1 (fallback)
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

    // 🔥 LEVEL 2 (TWÓJ SYSTEM)
    system,
  };
}