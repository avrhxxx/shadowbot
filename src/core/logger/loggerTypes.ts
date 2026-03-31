import type { TraceId } from "../ids/idTypes.js";

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
  name?: string;
  step?: string;
  parentStep?: string;
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

export type NormalizedError = {
  message: string;
  stack?: string;
};

// =====================================
// 🔥 MAIN PAYLOAD (B3 READY)
// =====================================

export type LogPayload = Readonly<{
  // 🔹 identity
  event: string;
  traceId?: TraceId;
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
  trace?: unknown;

  // 🔹 observability
  timing?: LogTiming;
  durationMs?: number;
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
}>;