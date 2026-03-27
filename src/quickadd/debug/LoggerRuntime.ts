// =====================================
// 📁 src/quickadd/debug/LoggerRuntime.ts
// =====================================

/**
 * 🧠 ROLE:
 * Runtime helpers (NO LOGIC)
 */

export function getTime(): string {
  return new Date().toISOString().split("T")[1].split(".")[0];
}