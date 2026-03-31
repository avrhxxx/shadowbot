// =====================================
// 📁 src/foundation/logger/loggerCore.ts
// =====================================

import pino from "pino";

// =====================================
// 🔹 ENV
// =====================================

const isPretty =
  process.env.LOG_PRETTY === "true" ||
  process.env.NODE_ENV !== "production";

// =====================================
// 🔹 HELPERS
// =====================================

function resolveScope(obj: any): string {
  if (obj?.meta?.system) return `SYSTEM:${obj.meta.system}`;
  if (obj?.system) return `SYSTEM:${obj.system}`;
  return "APP";
}

function simplifyEvent(event: string): string {
  if (!event) return "log";

  // system.init.start → init
  const parts = event.split(".");
  return parts[parts.length - 1];
}

// =====================================
// 🔹 LOGGER
// =====================================

export const baseLogger = pino({
  level: "debug",

  transport: isPretty
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname",
          messageFormat: (log: any, messageKey: string) => {
            const event = log[messageKey];
            const scope = resolveScope(log);

            return `[${scope}] ${simplifyEvent(event)}`;
          },
        },
      }
    : undefined,
});