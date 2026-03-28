// =====================================
// 📁 src/core/logger/log.ts
// =====================================

// =====================================
// 🔹 TYPES
// =====================================

type LogLevel = "info" | "warn" | "error";

export type LogError = {
  message: string;
  stack?: string;
  [key: string]: unknown;
};

export type LogMeta = Record<string, unknown>;
export type LogData = Record<string, unknown>;

export type EmitPayload = {
  traceId?: string;
  level?: LogLevel;
  data?: LogData;
  meta?: LogMeta;
  error?: LogError;
};

// =====================================
// 🔧 INTERNAL FORMATTER
// =====================================

function formatLog(
  event: string,
  payload?: EmitPayload
) {
  const time = new Date().toISOString();

  const level = payload?.level ?? "info";
  const traceId = payload?.traceId ?? "no-trace";

  return {
    time,
    level,
    event,
    traceId,
    data: payload?.data,
    meta: payload?.meta,
    error: payload?.error,
  };
}

// =====================================
// 🚀 LOGGER
// =====================================

export const logger = {
  emit(event: string, payload?: EmitPayload) {
    try {
      const logEntry = formatLog(event, payload);

      // 🔹 Możesz tu łatwo podmienić na np. pino / winston / sentry
      console.log(
        `${logEntry.time} | ${logEntry.traceId} | ${logEntry.level.toUpperCase()} | ${logEntry.event}`,
        {
          data: logEntry.data,
          meta: logEntry.meta,
          error: logEntry.error,
        }
      );

    } catch (err) {
      // 🔥 LOGGER NEVER FAILS
      console.error("LOGGER_FAILURE", err);
    }
  },
};