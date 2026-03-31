// =====================================
// 📁 src/foundation/logger/helpers/flowLogger.ts
// =====================================

import type { LogPayload } from "../loggerTypes";

type FlowStepPayload = Partial<LogPayload>;

export function createFlowLogger(
  log: any,
  scope: string,
  flowName: string
) {
  const base = flowName;

  return {
    start(payload?: FlowStepPayload) {
      log.info(`${base}.start`, {
        ...payload,
        scope,
      });
    },

    step(step: string, payload?: FlowStepPayload) {
      log.debug(`${base}.${step}`, {
        ...payload,
        scope,
        flow: { step },
      });
    },

    stepDebug(step: string, payload?: FlowStepPayload) {
      log.debug(`${base}.${step}`, {
        ...payload,
        scope,
        flow: { step },
      });
    },

    stepInfo(step: string, payload?: FlowStepPayload) {
      log.info(`${base}.${step}`, {
        ...payload,
        scope,
        flow: { step },
      });
    },

    stepWarn(step: string, payload?: FlowStepPayload) {
      log.warn(`${base}.${step}`, {
        ...payload,
        scope,
        flow: { step },
      });
    },

    stepError(
      step: string,
      error?: unknown,
      payload?: FlowStepPayload
    ) {
      log.error(`${base}.${step}`, error, {
        ...payload,
        scope,
        flow: { step },
      });
    },

    success(payload?: FlowStepPayload) {
      log.info(`${base}.success`, {
        ...payload,
        scope,
      });
    },

    fail(error?: unknown, payload?: FlowStepPayload) {
      log.error(`${base}.fail`, error, {
        ...payload,
        scope,
      });
    },
  };
}