// =====================================
// 📁 src/core/logger/observability/ObservabilityTypes.ts
// =====================================

export type LogLevel = "info" | "warn" | "error";

export type TraceType = "user" | "system";

// =====================================
// 🔹 CONTEXT
// =====================================

export type TraceContext = {
  traceId: string;
  type?: TraceType;
};

// =====================================
// 🔹 INPUT (PUBLIC)
// =====================================

export type LoggerEmitOptions = {
  event: string;
  traceId?: string; // zostawiamy dla prostoty API
  data?: unknown;

  level?: LogLevel;
  type?: TraceType;
};

// =====================================
// 🔹 INTERNAL (ENGINE)
// =====================================

export type InternalLog = {
  time: string;
  scope: string;
  event: string;
  level: LogLevel;
  type: TraceType;
  data?: unknown;
};

// =====================================
// 🔹 DEFINITIONS (BUILDER)
// =====================================

export type LogDefinitionTree = {
  [key: string]: string | LogDefinitionTree;
};
