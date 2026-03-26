// =====================================
// 📁 src/quickadd/core/IdGenerator.ts
// =====================================

/**
 * 🧠 ROLE:
 * Centralized ID generator for QuickAdd system.
 *
 * Responsibilities:
 * - generate traceId (per command execution)
 * - generate sessionId (per session lifecycle)
 *
 * ❗ RULES:
 * - pure utility (no side effects)
 * - NO logging
 * - NO dependencies
 * - deterministic structure
 */

// =====================================
// 🔹 INTERNAL HELPERS
// =====================================

function generateBase(): string {
  return (
    Date.now().toString(36) +
    "_" +
    Math.random().toString(36).slice(2, 8)
  );
}

// =====================================
// 🔥 PUBLIC API
// =====================================

export function createTraceId(): string {
  return "trace_" + generateBase();
}

export function createSessionId(): string {
  return "session_" + generateBase();
}