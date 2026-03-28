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

  context?: Record<string, unknown>;
  input?: Record<string, unknown>;
  result?: Record<string, unknown>;
  stats?: Record<string, number>;
  meta?: Record<string, unknown>;

  error?: {
    message: string;
    stack?: string;
    [key: string]: unknown;
  } | unknown;
};

// =====================================
// 🔧 HELPERS
// =====================================

function normalizeError(err: unknown): LogPayload["error"] {
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
  emit(payload: LogPayload | string) {
    // 🔹 SHORT VERSION SUPPORT
    if (typeof payload === "string") {
      console.log(
        `${new Date().toISOString()} | INFO | ${payload}`
      );
      return;
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
      error,
    } = payload;

    const time = new Date().toISOString();

    const normalizedError = normalizeError(error);

    console.log(
      `${time} | ${level.toUpperCase()} | ${traceId || "-"} | ${scope || "-"} | ${event}`,
      {
        ...(context && { context }),
        ...(input && { input }),
        ...(result && { result }),
        ...(stats && { stats }),
        ...(meta && { meta }),
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