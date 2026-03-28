// =====================================
// 📁 src/logger/builder/createLogger.ts
// =====================================

import { Observability } from "../core/Observability";
import { LogDefinitionTree } from "../observability/ObservabilityTypes";

// =====================================
// 🔹 LEVEL RESOLVER
// =====================================

function resolveLevel(event: string): "info" | "warn" | "error" {
  if (event.endsWith("_failed") || event.endsWith("_error")) {
    return "error";
  }

  if (
    event.includes("blocked") ||
    event.endsWith("_warn")
  ) {
    return "warn";
  }

  return "info";
}

// =====================================
// 🔥 BUILDER (RECURSIVE)
// =====================================

export function createLogger<T extends LogDefinitionTree>(
  defs: T
): BuildLogger<T> {
  function build(obj: LogDefinitionTree): any {
    const result: any = {};

    for (const key in obj) {
      const value = obj[key];

      if (typeof value === "string") {
        const eventName = value;

        result[key] = (
          traceId: string,
          data?: unknown,
          meta?: Record<string, unknown>
        ) => {
          Observability.emit({
            event: eventName,
            traceId,
            data,
            meta,
            level: resolveLevel(eventName),
          });
        };
      } else {
        result[key] = build(value);
      }
    }

    return result;
  }

  return build(defs);
}

// =====================================
// 🔹 TYPE INFERENCE
// =====================================

type BuildLogger<T> = {
  [K in keyof T]: T[K] extends string
    ? (
        traceId: string,
        data?: unknown,
        meta?: Record<string, unknown>
      ) => void
    : BuildLogger<T[K]>;
};