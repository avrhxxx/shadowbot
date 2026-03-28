// =====================================
// 📁 src/observability/runtime/ScopeResolver.ts
// =====================================

export function resolveScope(): string {
  try {
    const stack = new Error().stack;
    if (!stack) return "UNKNOWN";

    const line = stack
      .split("\n")
      .find(
        (l) =>
          !l.includes("Observability") &&
          !l.includes("node_modules")
      );

    const match = line?.match(/\/([^\/]+)\.(ts|js)/);

    return match ? match[1].toUpperCase() : "UNKNOWN";
  } catch {
    return "UNKNOWN";
  }
}