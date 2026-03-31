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
  // ❗ BEZ "system." — czysty namespace
  const base = `${systemName}.${flowName}`;

  return {
    // =====================================
    // ▶ START
    // =====================================
    start(payload?: FlowStepPayload) {
      log.info(`${base}.start`, payload);
    },

    // =====================================
    // 🔹 GENERIC STEP (DEBUG)
    // =====================================
    step(step: string, payload?: FlowStepPayload) {
      log.debug(`${base}.${step}`, {
        ...payload,
        flow: { step },
      });
    },

    // =====================================
    // 🔹 DEBUG
    // =====================================
    stepDebug(step: string, payload?: FlowStepPayload) {
      log.debug(`${base}.${step}`, {
        ...payload,
        flow: { step },
      });
    },

    // =====================================
    // ℹ INFO
    // =====================================
    stepInfo(step: string, payload?: FlowStepPayload) {
      log.info(`${base}.${step}`, {
        ...payload,
        flow: { step },
      });
    },

    // =====================================
    // ⚠ WARN
    // =====================================
    stepWarn(step: string, payload?: FlowStepPayload) {
      log.warn(`${base}.${step}`, {
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
      log.error(`${base}.${step}`, error, {
        ...payload,
        flow: { step },
      });
    },

    // =====================================
    // ✅ SUCCESS
    // =====================================
    success(payload?: FlowStepPayload) {
      log.info(`${base}.success`, payload);
    },

    // =====================================
    // 💥 FAIL
    // =====================================
    fail(error?: unknown, payload?: FlowStepPayload) {
      log.error(`${base}.fail`, error, payload);
    },
  };
}