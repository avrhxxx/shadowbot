// =====================================
// 📁 src/core/logger/loggerFlow.ts
// =====================================

import type { LogPayload } from "./loggerTypes.js";

// =====================================
// 🔹 TYPES
// =====================================

type StepFn<T = unknown> = () => Promise<T> | T;

type FlowOptions = {
  eventType?: LogPayload["eventType"];
  tags?: string[];
};

// =====================================
// 🔥 FLOW BUILDER (B3 ADVANCED)
// =====================================

export function createLoggerFlow(
  base: {
    event: (event: string, payload?: Partial<LogPayload>) => void;
    error: (
      event: string,
      error: unknown,
      payload?: Partial<LogPayload>
    ) => void;
  }
) {
  return function flow(name: string, options: FlowOptions = {}) {
    const steps: { name: string; fn: StepFn }[] = [];

    return {
      step(stepName: string, fn: StepFn) {
        steps.push({ name: stepName, fn });
        return this;
      },

      async run() {
        const flowStart = Date.now();

        base.event(`${name}.flow.start`, {
          eventType: options.eventType,
          tags: options.tags,
        });

        for (const step of steps) {
          const stepStart = Date.now();

          base.event(`${name}.${step.name}.start`);

          try {
            await step.fn();

            base.event(`${name}.${step.name}.success`, {
              durationMs: Date.now() - stepStart,
            });
          } catch (err) {
            base.error(`${name}.${step.name}.error`, err, {
              durationMs: Date.now() - stepStart,
            });

            base.error(`${name}.flow.error`, err, {
              durationMs: Date.now() - flowStart,
            });

            throw err;
          }
        }

        base.event(`${name}.flow.success`, {
          durationMs: Date.now() - flowStart,
        });
      },
    };
  };
}