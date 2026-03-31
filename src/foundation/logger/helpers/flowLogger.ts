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
  const base = flowName;

  const withSystem = (payload?: FlowStepPayload) => ({
    ...payload,
    system: systemName,
  });

  return {
    // =====================================
    // ▶ START
    // =====================================
    start(payload?: FlowStepPayload) {
      log.info(`${base}.start`, withSystem(payload));
    },

    // =====================================
    // 🔹 STEP (DEBUG)
    // =====================================
    step(step: string, payload?: FlowStepPayload) {
      log.debug(`${base}.${step}`, {
        ...withSystem(payload),
        flow: { step },
      });
    },

    // =====================================
    // ℹ STEP INFO
    // =====================================
    stepInfo(step: string, payload?: FlowStepPayload) {
      log.info(`${base}.${step}`, {
        ...withSystem(payload),
        flow: { step },
      });
    },

    // =====================================
    // ⚠ STEP WARN
    // =====================================
    stepWarn(step: string, payload?: FlowStepPayload) {
      log.warn(`${base}.${step}`, {
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
      log.error(`${base}.${step}`, error, {
        ...withSystem(payload),
        flow: { step },
      });
    },

    // =====================================
    // ✅ SUCCESS
    // =====================================
    success(payload?: FlowStepPayload) {
      log.info(`${base}.success`, withSystem(payload));
    },

    // =====================================
    // 💥 FAIL
    // =====================================
    fail(error?: unknown, payload?: FlowStepPayload) {
      log.error(`${base}.fail`, error, withSystem(payload));
    },
  };
}