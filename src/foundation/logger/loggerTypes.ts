// =====================================
// 📁 src/foundation/logger/loggerTypes.ts
// =====================================

export type LogLevel =
  | "debug"
  | "info"
  | "warn"
  | "error"
  | "fatal";

export type LogPayload = {
  level?: LogLevel;

  // 🔹 DATA
  context?: Record<string, unknown>;
  input?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: unknown;

  // 🔹 OBSERVABILITY
  timing?: {
    label: string;
    durationMs: number;
  };

  stats?: Record<string, number>;
  metrics?: Record<string, unknown>;
  meta?: Record<string, unknown>;

  // 🔹 FLOW
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