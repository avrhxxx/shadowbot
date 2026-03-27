// =====================================
// 📁 src/quickadd/debug/logger.ts
// =====================================

/**
 * 🧠 ROLE:
 * Central logging entrypoint
 *
 * ❗ RULES:
 * - ALWAYS import from here
 * - NEVER import DebugLogger directly
 */

export { createScopedLogger } from "./createScopedLogger";
export type { TraceType } from "./DebugLogger";