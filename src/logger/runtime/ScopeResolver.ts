// =====================================
// 📁 src/logger/runtime/ScopeResolver.ts
// =====================================

export function resolveScope(): string {
  try {
    const stack = new Error().stack;

    if (!stack) return "UNKNOWN";

    const lines = stack.split("\n");

    const callerLine = lines.find(
      (l) =>
        !l.includes("/logger/") &&
        !l.includes("node_modules")
    );

    if (!callerLine) return "UNKNOWN";

    const match = callerLine.match(/\/([^\/]+)\.(ts|js)/);

    return match
      ? match[1].toUpperCase()
      : "UNKNOWN";
  } catch {
    return "UNKNOWN";
  }
}