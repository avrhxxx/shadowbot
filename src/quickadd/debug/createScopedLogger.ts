// =====================================
// 📁 src/quickadd/debug/createScopedLogger.ts
// =====================================

/**
 * 🪵 ROLE:
 * Scoped logger factory (FINAL)
 *
 * ✔ Auto scope from file path
 * ✔ ONLY entry to DebugLogger
 */

import { __createLoggerInternal } from "./DebugLogger";

// =====================================
// 🔹 HELPERS
// =====================================

function extractScope(fileUrl: string): string {
  try {
    const file = fileUrl.split("/").pop() || "UNKNOWN";

    return file
      .replace(".ts", "")
      .replace(".js", "")
      .toUpperCase();
  } catch {
    return "UNKNOWN";
  }
}

// =====================================
// 🔹 FACTORY
// =====================================

export function createScopedLogger(fileUrl: string) {
  return __createLoggerInternal(extractScope(fileUrl));
}