// =====================================
// 📁 src/foundation/logger/loggerFactory.ts
// =====================================

import { baseLogger } from "./loggerCore";
import type { LogPayload, LogLevel } from "./loggerTypes";
import type { TraceContext } from "@/trace";
import type { SystemName } from "@/runtime/runtimeTypes";

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
// 🧱 INTERNAL TYPES
// =====================================

type LogInput = Omit<LogPayload, "event" | "level">;

type BuilderState = {
  system?: SystemName;
  flow?: string;
  step?: string;
};

// =====================================
// 🏭 FACTORY
// =====================================

export function createLogger(ctx?: TraceContext) {
  // =====================================
  // 🔹 CORE LOG FUNCTION
  // =====================================

  function emit(
    level: LogLevel,
    event: string,
    state: BuilderState,
    payload?: LogInput,
    error?: unknown
  ) {
    baseLogger[level]({
      event,

      // 🔥 CONTEXT (GLOBAL)
      traceId: ctx?.traceId,
      correlationId: ctx?.correlationId,
      flowId: ctx?.flowId,

      // 🔥 DSL STATE
      system: state.system ?? ctx?.system,
      flow: state.flow ? { step: state.step } : undefined,

      // 🔥 DATA
      ...(payload ?? {}),

      // 🔥 ERROR
      error: normalizeError(error ?? payload?.error),
    });
  }

  // =====================================
  // 🔹 BUILDER
  // =====================================

  function builder(state: BuilderState = {}) {
    return {
      // =============================
      // 🔹 CHAIN
      // =============================

      system(system: SystemName) {
        return builder({ ...state, system });
      },

      flow(flow: string) {
        return builder({ ...state, flow });
      },

      step(step: string) {
        return builder({ ...state, step });
      },

      // =============================
      // 🔹 RAW EVENTS
      // =============================

      event(event: string) {
        return {
          debug: (payload?: LogInput) =>
            emit("debug", event, state, payload),

          info: (payload?: LogInput) =>
            emit("info", event, state, payload),

          warn: (payload?: LogInput) =>
            emit("warn", event, state, payload),

          error: (err?: unknown, payload?: LogInput) =>
            emit("error", event, state, payload, err),

          fatal: (err?: unknown, payload?: LogInput) =>
            emit("fatal", event, state, payload, err),
        };
      },

      // =============================
      // 🔹 SEMANTIC EVENTS
      // =============================

      start(payload?: LogInput) {
        emit("info", "flow.start", state, payload);
      },

      success(payload?: LogInput) {
        emit("info", "flow.success", state, payload);
      },

      fail(err?: unknown, payload?: LogInput) {
        emit("error", "flow.fail", state, payload, err);
      },

      debug(payload?: LogInput) {
        emit("debug", "flow.debug", state, payload);
      },

      info(payload?: LogInput) {
        emit("info", "flow.info", state, payload);
      },

      warn(payload?: LogInput) {
        emit("warn", "flow.warn", state, payload);
      },

      // =============================
      // 🔹 STEP SHORTCUTS
      // =============================

      stepDebug(step: string, payload?: LogInput) {
        emit("debug", "flow.step", { ...state, step }, payload);
      },

      stepInfo(step: string, payload?: LogInput) {
        emit("info", "flow.step", { ...state, step }, payload);
      },

      stepError(step: string, err?: unknown, payload?: LogInput) {
        emit("error", "flow.step", { ...state, step }, payload, err);
      },
    };
  }

  // =====================================
  // 🔹 ROOT API (BACKWARD COMPAT)
  // =====================================

  const root = builder();

  return {
    // 🔥 NEW DSL
    system: root.system,
    flow: root.flow,
    step: root.step,

    // 🔥 DIRECT BUILDER ACCESS
    event: root.event,
    start: root.start,
    success: root.success,
    fail: root.fail,

    debug: root.debug,
    info: root.info,
    warn: root.warn,

    // 🔥 OLD API (compat)
    raw: (level: LogLevel, event: string, payload?: LogInput) =>
      emit(level, event, {}, payload),

    error: (event: string, err?: unknown, payload?: LogInput) =>
      emit("error", event, {}, payload, err),

    fatal: (event: string, err?: unknown, payload?: LogInput) =>
      emit("fatal", event, {}, payload, err),
  };
}