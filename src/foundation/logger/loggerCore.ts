// =====================================
// 📁 src/foundation/logger/loggerCore.ts
// =====================================

/**
 * 🧠 ROLE:
 * Base logger (Pino instance)
 */

import pino from "pino";

// DEV pretty logs
const isDev = process.env.NODE_ENV !== "production";

export const baseLogger = pino({
  level: "debug",

  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      }
    : undefined,
});