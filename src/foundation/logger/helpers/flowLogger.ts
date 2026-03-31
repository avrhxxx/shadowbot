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
  systemName: string,
  flowName: string
) {
  const baseEvent = `system.${systemName}.${flowName}`;

  return {
    // =====================================
    // ▶ START
    // =====================================
    start(payload?: FlowStepPayload) {
      log.info(`${baseEvent}.start`, payload);
    },

    // =====================================
    // 🔹 STEP (DEBUG)
    // =====================================
    step(step: string, payload?: FlowStepPayload) {
      log.debug(baseEvent, {
        ...payload,
        flow: { step },
      });
    },

    // =====================================
    // 🔹 DEBUG
    // =====================================
    stepDebug(step: string, payload?: FlowStepPayload) {
      log.debug(baseEvent, {
        ...payload,
        flow: { step },
      });
    },

    // =====================================
    // ℹ INFO
    // =====================================
    stepInfo(step: string, payload?: FlowStepPayload) {
      log.info(baseEvent, {
        ...payload,
        flow: { step },
      });
    },

    // =====================================
    // ⚠ WARN
    // =====================================
    stepWarn(step: string, payload?: FlowStepPayload) {
      log.warn(baseEvent, {
        ...payload,
        flow: { step },
      });
    },

    // =====================================
    // ❌ ERROR STEP
    // =====================================
    stepError(
      step: string,
      error?: unknown,
      payload?: FlowStepPayload
    ) {
      log.error(baseEvent, error, {
        ...payload,
        flow: { step },
      });
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