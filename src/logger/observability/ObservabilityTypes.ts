// =====================================
// 📁 src/logger/observability/ObservabilityTypes.ts
// =====================================

export type LogLevel = "info" | "warn" | "error";
export type TraceType = "user" | "system";

export type LogInput = {
  event: string;
  traceId?: string;
  data?: unknown;

  level?: LogLevel;
  type?: TraceType;
};

export type InternalLog = {
  time: string;
  scope: string;
  event: string;
  level: LogLevel;
  type: TraceType;
  data?: unknown;
};