// =====================================
// 📁 src/core/logger/loggerEmit.ts
// =====================================

import type { LogPayload } from "./loggerTypes.js";
import { loggerFormat } from "./loggerFormat.js";

// =====================================
// 🔥 EMIT (LOW LEVEL)
// =====================================

export function loggerEmit(input: LogPayload): void {
  try {
    const payload: LogPayload = {
      ...input,
      timestamp: input.timestamp ?? new Date().toISOString(),
    };

    const { header, lines } = loggerFormat(payload);

    console.group(header);

    for (const [key, value] of lines) {
      console.log(`${key}:`, value);
    }

    console.groupEnd();
  } catch (err) {
    console.log("LOGGER_EMIT_ERROR");
    console.log(err);
    console.log("original input:", input);
  }
}