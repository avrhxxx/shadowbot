// =====================================
// 📁 src/quickadd/debug/logger.ts
// =====================================

/**
 * 🧠 ROLE:
 * Central logging entrypoint for QuickAdd system (ENFORCED)
 *
 * ❗ RULES:
 * - ALWAYS import from this file
 * - DO NOT import DebugLogger directly
 * - DO NOT import createScopedLogger directly
 * - This is the ONLY allowed entrypoint
 */

// =====================================
// 🔒 EXPORT CONTROL
// =====================================

export { createScopedLogger } from "./createScopedLogger";