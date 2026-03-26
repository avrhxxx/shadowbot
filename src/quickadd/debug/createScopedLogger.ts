// =====================================
// 📁 src/quickadd/debug/createScopedLogger.ts
// =====================================

/**
 * 🪵 ROLE:
 * Scoped logger factory (STRICT MODE)
 *
 * ✔ Derives scope automatically from file path
 * ✔ Enforces usage of central logger only
 *
 * ❗ RULES:
 * - ONLY used via logger.ts
 * - DO NOT import DebugLogger directly outside this file
 */

import { createLogger } from "./DebugLogger";

// =====================================
// 🔹 HELPERS
// =====================================

function extractScopeFromPath(fileUrl: string): string {
  try {
    const parts = fileUrl.split("/");
    const file = parts[parts.length - 1] || "UNKNOWN";

    const name = file
      .replace(".ts", "")
      .replace(".js", "");

    return name.toUpperCase();
  } catch {
    return "UNKNOWN";
  }
}

// =====================================
// 🔹 FACTORY
// =====================================

export function createScopedLogger(
  fileUrl: string,
  overrideScope?: string
) {
  const scope =
    overrideScope || extractScopeFromPath(fileUrl);

  return createLogger(scope);
}