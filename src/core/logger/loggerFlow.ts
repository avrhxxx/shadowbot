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
  context?: Record<string, unknown>;
  input?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

// =====================================
// 🔧 HELPERS
// =====================================

function normalizeResult(result: unknown): Record<string, unknown> {
  if (result === null || result === undefined) return { value: result };

  if (typeof result === "object") return result as Record<string, unknown>;

  return { value: result };
}

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

    const basePayload: Partial<LogPayload> = {
      eventType: options.eventType,
      tags: options.tags,
      context: options.context,
      input: options.input,
      meta: options.meta,
      flow: {
        name,
      },
    };

    return {
      step(stepName: string, fn: StepFn) {
        steps.push({ name: stepName, fn });
        return this;
      },

      async run() {
        const flowStart = Date.now();

        // 🔹 FLOW START
        base.event(`${name}.flow.start`, {
          ...basePayload,
          flow: {
            name,
            step: "flow:start",
          },
        });

        for (const step of steps) {
          const stepStart = Date.now();

          // 🔹 STEP START
          base.event(`${name}.${step.name}.start`, {
            ...basePayload,
            flow: {
              name,
              step: step.name,
            },
          });

          try {
            const result = await step.fn();
            const durationMs = Date.now() - stepStart;

            // 🔹 STEP SUCCESS
            base.event(`${name}.${step.name}.success`, {
              ...basePayload,
              flow: {
                name,
                step: step.name,
              },
              result: normalizeResult(result),
              durationMs,
              timing: {
                label: `${name}.${step.name}`,
                durationMs,
              },
            });
          } catch (err) {
            const durationMs = Date.now() - stepStart;

            // 🔹 STEP ERROR
            base.error(`${name}.${step.name}.error`, err, {
              ...basePayload,
              flow: {
                name,
                step: step.name,
              },
              durationMs,
              timing: {
                label: `${name}.${step.name}`,
                durationMs,
              },
            });

            // 🔹 FLOW ERROR
            base.error(`${name}.flow.error`, err, {
              ...basePayload,
              flow: {
                name,
                step: "flow:error",
              },
              durationMs: Date.now() - flowStart,
              timing: {
                label: name,
                durationMs: Date.now() - flowStart,
              },
            });

            throw err;
          }
        }

        const durationMs = Date.now() - flowStart;

        // 🔹 FLOW SUCCESS
        base.event(`${name}.flow.success`, {
          ...basePayload,
          flow: {
            name,
            step: "flow:success",
          },
          durationMs,
          timing: {
            label: name,
            durationMs,
          },
        });
      },
    };
  };
}