// =====================================
// 📁 src/core/logger/loggerTypes.ts
// =====================================

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export type LogEventType =
  | "system"
  | "user"
  | "interaction"
  | "external"
  | "job"
  | "security"
  | "performance"
  | "debug";

export type LogTiming = {
  label: string;
  durationMs: number;
};

export type LogFlow = {
  step?: string;
};

export type LogDecision = {
  condition: string;
  result: boolean;
};

export type LogInteraction = {
  type?: string;
  name?: string;
  customId?: string;
};

// =====================================
// 🔥 MAIN PAYLOAD (FUTURE-PROOF)
// =====================================

export type LogPayload = {
  // 🔹 identity
  event: string;
  traceId?: string;
  scope?: string;

  // 🔹 meta
  level?: LogLevel;
  eventType?: LogEventType;
  timestamp?: string;
  schemaVersion?: number;

  // 🔹 structured data
  context?: Record<string, unknown>;
  input?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: unknown;

  // 🔹 observability
  timing?: LogTiming;
  stats?: Record<string, number>;
  metrics?: Record<string, unknown>;

  // 🔹 advanced
  meta?: Record<string, unknown>;
  tags?: string[];

  // 🔹 flow control
  flow?: LogFlow;
  decision?: LogDecision;

  // 🔹 interaction layer
  interaction?: LogInteraction;
};