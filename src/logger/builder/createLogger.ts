// =====================================
// 📁 src/logger/builder/createLogger.ts
// =====================================

import { Observability } from "../core/Observability";

// =====================================
// 🔹 TYPES
// =====================================

type Definition = Record<
  string,
  Record<string, string>
>;

// =====================================
// 🔥 BUILDER
// =====================================

export function createLogger<T extends Definition>(defs: T) {
  const result: any = {};

  for (const group in defs) {
    result[group] = {};

    for (const key in defs[group]) {
      const eventName = defs[group][key];

      result[group][key] = (
        traceId: string,
        data?: unknown
      ) => {
        const level =
          eventName.endsWith("_failed")
            ? "error"
            : eventName.includes("blocked")
            ? "warn"
            : "info";

        Observability.emit({
          event: eventName,
          traceId,
          data,
          level,
        });
      };
    }
  }

  return result as {
    [K in keyof T]: {
      [E in keyof T[K]]: (
        traceId: string,
        data?: unknown
      ) => void;
    };
  };
}