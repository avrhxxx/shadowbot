// =====================================
// 📁 src/quickadd/debug/LoggerRuntime.ts
// =====================================

/**
 * 🧠 ROLE:
 * Runtime helpers for logger.
 *
 * Responsible for:
 * - resolving scope (file name)
 * - generating timestamps
 *
 * ❗ RULES:
 * - NO business logic
 * - NO logging here
 * - PURE utility layer
 *
 * ⚠️ NOTE:
 * - stack parsing is used to avoid passing scope manually
 * - works in Node (Fly.io compatible)
 */

export function resolveScope(): string {
  const stack = new Error().stack;

  if (!stack) return "UNKNOWN";

  const lines = stack.split("\n");

  const callerLine = lines.find(
    (l) =>
      !l.includes("Logger") &&
      !l.includes("node_modules")
  );

  if (!callerLine) return "UNKNOWN";

  const match = callerLine.match(/\/([^\/]+)\.(ts|js)/);

  return match ? match[1].toUpperCase() : "UNKNOWN";
}

export function getTime(): string {
  return new Date().toISOString().split("T")[1].split(".")[0];
}