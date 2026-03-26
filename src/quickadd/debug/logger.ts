// =====================================
// 📁 src/quickadd/debug/logger.ts
// =====================================

/**
 * 🧠 ROLE:
 * Central logging entrypoint for QuickAdd system.
 *
 * ✔ Single import point for all logging utilities
 * ✔ Hides internal file structure
 * ✔ Enables future extensibility (log levels, transports, etc.)
 *
 * ❗ RULES:
 * - ALWAYS import from this file
 * - DO NOT import DebugLogger / createScopedLogger directly
 *
 * ✅ USAGE:
 * import { createScopedLogger } from "@/quickadd/debug/logger";
 *
 * const log = createScopedLogger(import.meta.url);
 */

// =====================================
// 🔗 EXPORTS
// =====================================

export { createLogger } from "./DebugLogger";
export { createScopedLogger } from "./createScopedLogger";