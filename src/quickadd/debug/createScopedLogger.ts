// =====================================
// 📁 src/quickadd/debug/createScopedLogger.ts
// =====================================

import { createLogger } from "./DebugLogger";

function extractScopeFromPath(fileUrl: string): string {
  try {
    const parts = fileUrl.split("/");
    const file = parts[parts.length - 1] || "UNKNOWN";
    const name = file.replace(".ts", "").replace(".js", "");

    return name.toUpperCase();
  } catch {
    return "UNKNOWN";
  }
}

export function createScopedLogger(
  fileUrl: string,
  overrideScope?: string
) {
  const scope = overrideScope || extractScopeFromPath(fileUrl);
  return createLogger(scope);
}