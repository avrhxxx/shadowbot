// =====================================
// 📁 src/quickadd/debug/createScopedLogger.ts
// =====================================

/**
 * 🧠 ROLE:
 * Creates logger with auto-derived scope from file path.
 *
 * ✔ Eliminates manual scope strings
 * ✔ Ensures consistency across system
 * ✔ Compatible with existing DebugLogger
 *
 * ❗ RULES:
 * - ALWAYS use import.meta.url
 * - NO manual scope unless override is needed
 */

import { createLogger } from "./DebugLogger";

// =====================================
// 🔧 HELPERS
// =====================================

function extractScopeFromPath(fileUrl: string): string {
  try {
    // file:///.../src/quickadd/ocr/OCRProcessor.ts
    const parts = fileUrl.split("/");

    const file = parts[parts.length - 1] || "UNKNOWN";
    const name = file.replace(".ts", "").replace(".js", "");

    return name.toUpperCase();
  } catch {
    return "UNKNOWN";
  }
}

// =====================================
// 🚀 FACTORY
// =====================================

export function createScopedLogger(
  fileUrl: string,
  overrideScope?: string
) {
  const scope = overrideScope || extractScopeFromPath(fileUrl);

  return createLogger(scope);
}