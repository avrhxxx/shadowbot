// =====================================
// 📁 src/core/logger/log.ts
// =====================================

// =====================================
// 🔹 TYPES
// =====================================

type LogLevel = "info" | "warn" | "error";

export type LogPayload = {
  scope?: string;
  event: string;
  traceId?: string;

  level?: LogLevel;

  // 🔹 STANDARD FIELDS
  context?: Record<string, unknown>;
  input?: Record<string, unknown>;
  result?: Record<string, unknown>;
  stats?: Record<string, number>;
  meta?: Record<string, unknown>;

  // 🔥 OBSERVABILITY
  metrics?: {
    increment?: string;
    value?: number;

    // ✅ FIX: allow legacy / accidental fields
    [key: string]: unknown;
  };

  timing?: {
    label: string;
    durationMs: number;
  };

  error?: unknown;
};

// =====================================
// 🔧 HELPERS
// =====================================

function normalizeError(err: unknown) {
  if (!err) return undefined;

  if (err instanceof Error) {
    return {
      message: err.message,
      stack: err.stack,
    };
  }

  return {
    message: String(err),
  };
}

// =====================================
// 🔥 LOGGER
// =====================================

export const logger = {
  emit(payload: LogPayload | string): void {
    // 🔹 SHORT VERSION → NORMALIZE
    if (typeof payload === "string") {
      payload = { event: payload };
    }

    const {
      scope,
      event,
      traceId,
      level = "info",
      context,
      input,
      result,
      stats,
      meta,
      metrics,
      timing,
      error,
    } = payload;

    const time = new Date().toISOString();
    const normalizedError = normalizeError(error);
    const finalEvent = event || "unknown_event";

    console.log(
      `${time} | ${level.toUpperCase()} | ${traceId || "-"} | ${scope || "-"} | ${finalEvent}`,
      {
        ...(context && { context }),
        ...(input && { input }),
        ...(result && { result }),
        ...(stats && { stats }),
        ...(meta && { meta }),

        // 🔥 OBSERVABILITY
        ...(metrics && { metrics }),
        ...(timing && { timing }),

        ...(normalizedError && { error: normalizedError }),
      }
    );
  },

  // 🔹 SHORTCUTS
  info(event: string, data?: Partial<LogPayload>) {
    this.emit({ ...data, event, level: "info" });
  },

  warn(event: string, data?: Partial<LogPayload>) {
    this.emit({ ...data, event, level: "warn" });
  },

  error(event: string, data?: Partial<LogPayload>) {
    this.emit({ ...data, event, level: "error" });
  },
};