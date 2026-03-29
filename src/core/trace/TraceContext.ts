// =====================================
// 📁 src/core/trace/TraceContext.ts
// =====================================

import type { TraceId } from "../ids/IdGenerator";

export type TraceContext = Readonly<{
  traceId: TraceId;
  userId?: string;
  source: "discord" | "system" | "worker";

  // 🔥 SYSTEM DOMAIN (keep in sync with system modules)
  system?: "events" | "absence" | "points" | "quickadd";
}>;