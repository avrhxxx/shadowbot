// =====================================
// 📁 src/foundation/logger/loggerTypes.ts
// =====================================

/**
 * 🧠 ROLE:
 * Full structured log schema (future-proof)
 *
 * 📥 INPUT:
 * - used by loggerFactory
 *
 * 📤 OUTPUT:
 * - typing for structured logs
 *
 * ❗ NOTE:
 * - `event` is NOT part of payload (passed separately)
 */

export type LogLevel =
  | "debug"
  | "info"
  | "warn"
  | "error"
  | "fatal";

export type LogPayload = {
  // classification
  level?: LogLevel;

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