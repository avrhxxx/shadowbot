// =====================================
// 📁 src/core/trace/TraceContext.ts
// =====================================

export type TraceContext = {
  traceId: string;
  userId?: string;
  source: "discord" | "system" | "worker";
};