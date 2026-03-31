// =====================================
// 📁 src/core/logger/loggerEmit.ts
// =====================================

import type { LogPayload } from "./loggerTypes.js";
import { loggerFormat } from "./loggerFormat.js";

// =====================================
// 🔧 HELPERS
// =====================================

function normalizeError(err: unknown) {
  if (!err) return undefined;

  if (err instanceof Error) {
    return {
      message: err.message,
      stack: err.stack,
    };
  }

  return {
    message: String(err),
  };
}

// =====================================
// 🔥 EMIT (LOW LEVEL)
// =====================================

export function loggerEmit(input: LogPayload): void {
  try {
    const payload: LogPayload = {
      ...input,
      timestamp: input.timestamp ?? new Date().toISOString(),
      error: normalizeError(input.error),
    };

    loggerFormat(payload);
  } catch (err) {
    console.log("LOGGER_EMIT_ERROR", err, input);
  }
}