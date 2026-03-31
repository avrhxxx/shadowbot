// =====================================
// 📁 src/core/logger/loggerAuto.ts
// =====================================

import type { LogPayload } from "./loggerTypes.js";

// =====================================
// 🔹 TYPES
// =====================================

type AutoOptions = {
  eventType?: LogPayload["eventType"];
  context?: Record<string, unknown>;
  input?: Record<string, unknown>;
  tags?: string[];
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
// 🔥 AUTO WRAPPER (B3 CORE)
// =====================================

export function createLoggerAuto(
  base: {
    event: (event: string, payload?: Partial<LogPayload>) => void;
    error: (
      event: string,
      error: unknown,
      payload?: Partial<LogPayload>
    ) => void;
  }
) {
  return async function auto<T>(
    event: string,
    fn: () => Promise<T>,
    options: AutoOptions = {}
  ): Promise<T> {
    const start = Date.now();

    const basePayload: Partial<LogPayload> = {
      eventType: options.eventType,
      context: options.context,
      input: options.input,
      tags: options.tags,
      meta: options.meta,
      flow: {
        name: event,
        step: "auto",
      },
    };

    // 🔹 START
    base.event(`${event}.start`, basePayload);

    try {
      const result = await fn();
      const durationMs = Date.now() - start;

      // 🔹 SUCCESS
      base.event(`${event}.success`, {
        ...basePayload,
        result: normalizeResult(result),
        durationMs,
        timing: {
          label: event,
          durationMs,
        },
      });

      return result;
    } catch (err) {
      const durationMs = Date.now() - start;

      // 🔹 ERROR
      base.error(`${event}.error`, err, {
        ...basePayload,
        durationMs,
        timing: {
          label: event,
          durationMs,
        },
      });

      throw err; // 🔥 MUST — nie zjadamy błędów
    }
  };
}