// =====================================
// 📁 src/foundation/logger/loggerTypes.ts
// =====================================

/**
 * 🧠 ROLE:
 * Full structured log schema (future-proof)
 */

export type LogLevel =
  | "debug"
  | "info"
  | "warn"
  | "error"
  | "fatal";

export type LogPayload = {
  // identity
  event: string;
  level?: LogLevel;

  // classification
  eventType?:
    | "system"
    | "user"
    | "interaction"
    | "external"
    | "job"
    | "performance"
    | "debug";

  // structured data
  context?: Record<string, unknown>;
  input?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: unknown;

  // observability
  timing?: {
    label: string;
    durationMs: number;
  };

  stats?: Record<string, number>;
  metrics?: Record<string, unknown>;
  meta?: Record<string, unknown>;

  // flow
  flow?: {
    step?: string;
  };

  decision?: {
    condition: string;
    result: boolean;
  };

  interaction?: {
    type?: string;
    name?: string;
    customId?: string;
  };
};