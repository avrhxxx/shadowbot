// =====================================
// 📁 src/core/logger/loggerApi.ts
// =====================================

import type { TraceContext } from "@/core/trace/TraceContext.js";
import { emit } from "./loggerEmit.js";

// =====================================
// 🔹 TYPES
// =====================================

type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

type FlatPayload = Record<string, unknown>;

type AutoFn<T> = () => Promise<T> | T;

// =====================================
// 🔹 INTERNAL HELPERS
// =====================================

function now() {
  return Date.now();
}

// =====================================
// 🔥 CTX LOGGER FACTORY
// =====================================

export function createLogger(ctx: TraceContext) {
  function base(
    level: LogLevel,
    event: string,
    payload?: FlatPayload,
    error?: unknown
  ) {
    emit({
      level,
      event,
      traceId: ctx.traceId,
      scope: ctx.system ?? "unknown",

      context: {
        trace: ctx,
        ...(payload ?? {}),
      },

      error,
    });
  }

  // =====================================
  // 🔹 BASIC API
  // =====================================

  const api = {
    event: (event: string, payload?: FlatPayload) =>
      base("info", event, payload),

    debug: (event: string, payload?: FlatPayload) =>
      base("debug", event, payload),

    info: (event: string, payload?: FlatPayload) =>
      base("info", event, payload),

    warn: (event: string, payload?: FlatPayload) =>
      base("warn", event, payload),

    error: (event: string, err: unknown, payload?: FlatPayload) =>
      base("error", event, payload, err),

    fatal: (event: string, err: unknown, payload?: FlatPayload) =>
      base("fatal", event, payload, err),

    // =====================================
    // 🔥 AUTOLOGGER
    // =====================================

    async auto<T>(event: string, fn: AutoFn<T>): Promise<T> {
      const start = now();

      base("info", `${event}.start`);

      try {
        const result = await fn();

        base("info", `${event}.success`, {
          durationMs: now() - start,
        });

        return result;
      } catch (err) {
        base(
          "error",
          `${event}.error`,
          {
            durationMs: now() - start,
          },
          err
        );

        throw err;
      }
    },

    // =====================================
    // 🔥 FLOW LOGGER (B3 CORE)
    // =====================================

    flow(flowName: string, basePayload?: FlatPayload) {
      const start = now();

      let finished = false;

      function flowBase(
        level: LogLevel,
        suffix: string,
        payload?: FlatPayload,
        error?: unknown
      ) {
        base(
          level,
          `${flowName}.${suffix}`,
          {
            ...(basePayload ?? {}),
            ...(payload ?? {}),
          },
          error
        );
      }

      return {
        // =============================
        // 🔹 RUN (AUTO FLOW)
        // =============================

        async run<T>(fn: AutoFn<T>): Promise<T> {
          flowBase("info", "start");

          try {
            const result = await fn();

            flowBase("info", "success", {
              durationMs: now() - start,
            });

            finished = true;
            return result;
          } catch (err) {
            flowBase(
              "error",
              "error",
              {
                durationMs: now() - start,
              },
              err
            );

            finished = true;
            throw err;
          }
        },

        // =============================
        // 🔹 MANUAL STEPS
        // =============================

        step(step: string, payload?: FlatPayload) {
          flowBase("info", step, payload);
        },

        success(payload?: FlatPayload) {
          if (finished) return;

          flowBase("info", "success", {
            durationMs: now() - start,
            ...(payload ?? {}),
          });

          finished = true;
        },

        error(err: unknown, payload?: FlatPayload) {
          if (finished) return;

          flowBase(
            "error",
            "error",
            {
              durationMs: now() - start,
              ...(payload ?? {}),
            },
            err
          );

          finished = true;
        },
      };
    },
  };

  return api;
}

// =====================================
// 🔹 PUBLIC ENTRYPOINT
// =====================================

export const log = {
  ctx: createLogger,
};