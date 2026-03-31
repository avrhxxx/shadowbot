// =====================================
// 📁 src/foundation/logger/helpers/flowLogger.ts
// =====================================

import type { LogPayload } from "../loggerTypes";

// =====================================
// 🔧 TYPES
// =====================================

type FlowStepPayload = Partial<LogPayload>;

// =====================================
// 🚀 FLOW LOGGER (FINAL)
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
      log.info(`${baseEvent}.start`, {
        ...payload,
        meta: {
          ...payload?.meta,
          system: systemName,
        },
      });
    },

    // =====================================
    // 🔹 STEP DEBUG
    // =====================================
    stepDebug(step: string, payload?: FlowStepPayload) {
      log.debug(`${baseEvent}.${step}`, {
        ...payload,
        meta: {
          ...payload?.meta,
          system: systemName,
        },
        flow: { step },
      });
    },

    // =====================================
    // 🔹 STEP INFO
    // =====================================
    stepInfo(step: string, payload?: FlowStepPayload) {
      log.info(`${baseEvent}.${step}`, {
        ...payload,
        meta: {
          ...payload?.meta,
          system: systemName,
        },
        flow: { step },
      });
    },

    // =====================================
    // ⚠ STEP WARN
    // =====================================
    stepWarn(step: string, payload?: FlowStepPayload) {
      log.warn(`${baseEvent}.${step}`, {
        ...payload,
        meta: {
          ...payload?.meta,
          system: systemName,
        },
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
      log.error(`${baseEvent}.${step}`, error, {
        ...payload,
        meta: {
          ...payload?.meta,
          system: systemName,
        },
        flow: { step },
      });
    },

    // =====================================
    // ✅ SUCCESS
    // =====================================
    success(payload?: FlowStepPayload) {
      log.info(`${baseEvent}.success`, {
        ...payload,
        meta: {
          ...payload?.meta,
          system: systemName,
        },
      });
    },

    // =====================================
    // 💥 FAIL
    // =====================================
    fail(error?: unknown, payload?: FlowStepPayload) {
      log.error(`${baseEvent}.fail`, error, {
        ...payload,
        meta: {
          ...payload?.meta,
          system: systemName,
        },
      });
    },
  };
}