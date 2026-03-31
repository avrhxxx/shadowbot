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
  log: any,
  baseEvent: string
) {
  return {
    // =====================================
    // ▶ START
    // =====================================
    start(payload?: FlowStepPayload) {
      log.info(`${baseEvent}.start`, payload);
    },

    // =====================================
    // 🔹 STEP (neutral)
    // =====================================
    step(step: string, payload?: FlowStepPayload) {
      log.debug(`${baseEvent}.${step}`, {
        ...payload,
        flow: { step },
      });
    },

    // =====================================
    // ℹ STEP INFO
    // =====================================
    stepInfo(step: string, payload?: FlowStepPayload) {
      log.info(`${baseEvent}.${step}`, {
        ...payload,
        flow: { step },
      });
    },

    // =====================================
    // ⚠ STEP WARN
    // =====================================
    stepWarn(step: string, payload?: FlowStepPayload) {
      log.warn(`${baseEvent}.${step}`, {
        ...payload,
        flow: { step },
      });
    },

    // =====================================
    // ❌ FAIL STEP
    // =====================================
    stepError(
      step: string,
      error?: unknown,
      payload?: FlowStepPayload
    ) {
      log.error(
        `${baseEvent}.${step}`,
        error,
        {
          ...payload,
          flow: { step },
        }
      );
    },

    // =====================================
    // ✅ SUCCESS
    // =====================================
    success(payload?: FlowStepPayload) {
      log.info(`${baseEvent}.success`, payload);
    },

    // =====================================
    // 💥 FAIL
    // =====================================
    fail(error?: unknown, payload?: FlowStepPayload) {
      log.error(`${baseEvent}.fail`, error, payload);
    },
  };
}