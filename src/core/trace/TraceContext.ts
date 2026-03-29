// =====================================
// 📁 src/core/trace/TraceContext.ts
// =====================================

import type { TraceId } from "../ids/IdGenerator";

/**
 * 🔍 TraceContext
 * 
 * - immutable context passed through system flows
 * - used for logging, tracing and observability
 * - SHOULD NOT be mutated after creation
 * 
 * ⚠️ system field MUST stay in sync with system modules
 */
export type TraceContext = Readonly<{
  traceId: TraceId;

  // 🔹 optional user context
  userId?: string;

  // 🔹 origin of execution
  source: "discord" | "system" | "worker";

  // 🔥 SYSTEM DOMAIN (keep in sync with system modules)
  system?: "events" | "absence" | "points" | "quickadd";
}>;