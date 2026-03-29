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

    // ✅ allow flexible fields
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
// 🔥 LOGGER (IMMUTABLE API)
// =====================================

export const logger = {
  emit(payload: LogPayload | string): void {
    // 🔒 GUARD
    if (!payload) {
      console.log("LOGGER_ERROR: empty payload");
      return;
    }

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

    // ❗ HARD REQUIREMENT
    if (!event) {
      console.log("LOGGER_ERROR: missing event", payload);
      return;
    }

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

        ...(metrics && { metrics }),
        ...(timing && { timing }),

        ...(normalizedError && { error: normalizedError }),
      }
    );
  },
};