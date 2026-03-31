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
};

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

    base.event(`${event}.start`, {
      eventType: options.eventType,
      context: options.context,
      input: options.input,
      tags: options.tags,
    });

    try {
      const result = await fn();

      base.event(`${event}.success`, {
        eventType: options.eventType,
        result: typeof result === "object" ? result : { value: result },
        durationMs: Date.now() - start,
        tags: options.tags,
      });

      return result;
    } catch (err) {
      base.error(`${event}.error`, err, {
        eventType: options.eventType,
        durationMs: Date.now() - start,
        tags: options.tags,
      });

      throw err; // 🔥 MUST — nie zjadamy błędów
    }
  };
}