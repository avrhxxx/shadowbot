// =====================================
// 📁 src/foundation/logger/helpers/flowLogger.ts
// =====================================

import type { LogPayload } from "../loggerTypes";

type FlowStepPayload = Partial<LogPayload>;

export function createFlowLogger(
  log: any,
  systemName: string,
  flowName: string
) {
  const base = flowName;

  return {
    start(payload?: FlowStepPayload) {
      log.info(`${base}.start`, {
        ...payload,
        meta: { ...(payload?.meta ?? {}), system: systemName },
      });
    },

    step(step: string, payload?: FlowStepPayload) {
      log.debug(`${base}.${step}`, {
        ...payload,
        flow: { step },
        meta: { ...(payload?.meta ?? {}), system: systemName },
      });
    },

    stepDebug(step: string, payload?: FlowStepPayload) {
      log.debug(`${base}.${step}`, {
        ...payload,
        flow: { step },
        meta: { ...(payload?.meta ?? {}), system: systemName },
      });
    },

    stepInfo(step: string, payload?: FlowStepPayload) {
      log.info(`${base}.${step}`, {
        ...payload,
        flow: { step },
        meta: { ...(payload?.meta ?? {}), system: systemName },
      });
    },

    stepWarn(step: string, payload?: FlowStepPayload) {
      log.warn(`${base}.${step}`, {
        ...payload,
        flow: { step },
        meta: { ...(payload?.meta ?? {}), system: systemName },
      });
    },

    stepError(step: string, error?: unknown, payload?: FlowStepPayload) {
      log.error(`${base}.${step}`, error, {
        ...payload,
        flow: { step },
        meta: { ...(payload?.meta ?? {}), system: systemName },
      });
    },

    success(payload?: FlowStepPayload) {
      log.info(`${base}.success`, {
        ...payload,
        meta: { ...(payload?.meta ?? {}), system: systemName },
      });
    },

    fail(error?: unknown, payload?: FlowStepPayload) {
      log.error(`${base}.fail`, error, {
        ...payload,
        meta: { ...(payload?.meta ?? {}), system: systemName },
      });
    },
  };
}