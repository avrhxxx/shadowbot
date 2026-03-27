// =====================================
// 📁 src/quickadd/logger.ts
// =====================================

/**
 * 🧠 ROLE:
 * Global logging facade for QuickAdd.
 *
 * ❗ RULES:
 * - SINGLE import point across whole system
 * - NO logic here
 * - proxies debug layer
 *
 * ✅ BENEFITS:
 * - no relative import hell
 * - no refactors when logger changes
 */

export { log } from "./debug/DebugLogger";
export { metrics } from "./debug/Metrics";
export { timing } from "./debug/Timing";