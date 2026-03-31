// =====================================
// 📁 src/foundation/logger/helpers/flowLogger.ts
// =====================================

import type { LogPayload } from "../loggerTypes";

// =====================================
// 🔧 TYPES
// =====================================

type FlowStepPayload = Partial<LogPayload>;

// =====================================
// 🚀 FLOW LOGGER
// =====================================

export function createFlowLogger(
  baseLog: any,
  system: string,
  flowName: string
) {
  const baseEvent = `${system}.${flowName}`;

  function withSystem(payload?: FlowStepPayload) {
    return {
      ...(payload ?? {}),
      meta: {
        ...(payload?.meta ?? {}),
        system,
      },
    };
  }

  return {
    // =====================================
    // ▶ START
    // =====================================
    start(payload?: FlowStepPayload) {
      baseLog.info(`${baseEvent}.start`, withSystem(payload));
    },

    // =====================================
    // 🔹 GENERIC STEP
    // =====================================
    step(step: string, payload?: FlowStepPayload) {
      baseLog.debug(`${baseEvent}.${step}`, {
        ...withSystem(payload),
        flow: { step },
      });
    },

    // =====================================
    // ℹ STEP INFO
    // =====================================
    stepInfo(step: string, payload?: FlowStepPayload) {
      baseLog.info(`${baseEvent}.${step}`, {
        ...withSystem(payload),
        flow: { step },
      });
    },

    // =====================================
    // ⚠ STEP WARN
    // =====================================
    stepWarn(step: string, payload?: FlowStepPayload) {
      baseLog.warn(`${baseEvent}.${step}`, {
        ...withSystem(payload),
        flow: { step },
      });
    },

    // =====================================
    // ❌ STEP ERROR
    // =====================================
    stepError(
      step: string,
      error?: unknown,
      payload?: FlowStepPayload
    ) {
      baseLog.error(`${baseEvent}.${step}`, error, {
        ...withSystem(payload),
        flow: { step },
      });
    },

    // =====================================
    // 📌 CUSTOM EVENT
    // =====================================
    event(event: string) {
      return {
        info: (payload?: FlowStepPayload) =>
          baseLog.info(`${baseEvent}.${event}`, withSystem(payload)),

        debug: (payload?: FlowStepPayload) =>
          baseLog.debug(`${baseEvent}.${event}`, withSystem(payload)),

        warn: (payload?: FlowStepPayload) =>
          baseLog.warn(`${baseEvent}.${event}`, withSystem(payload)),

        error: (error?: unknown, payload?: FlowStepPayload) =>
          baseLog.error(`${baseEvent}.${event}`, error, withSystem(payload)),
      };
    },

    // =====================================
    // ✅ SUCCESS
    // =====================================
    success(payload?: FlowStepPayload) {
      baseLog.info(`${baseEvent}.success`, withSystem(payload));
    },

    // =====================================
    // 💥 FAIL
    // =====================================
    fail(error?: unknown, payload?: FlowStepPayload) {
      baseLog.error(`${baseEvent}.fail`, error, withSystem(payload));
    },
  };
}