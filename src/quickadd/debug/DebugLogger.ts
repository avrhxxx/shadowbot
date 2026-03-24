// =====================================
// 📁 src/quickadd/debug/DebugLogger.ts
// =====================================

/**
 * 🪵 ROLE:
 * Central logging system for QuickAdd module.
 *
 * Provides:
 * - scoped logs (OCR, PARSER, CORE, etc.)
 * - trace logs (with traceId for full pipeline tracking)
 * - structured logging (consistent format)
 *
 * ❗ RULES:
 * - lightweight (no external deps)
 * - safe to use everywhere
 * - no business logic
 */

// =====================================
// 🔹 TYPES
// =====================================

type LogLevel = "log" | "warn" | "error" | "trace";

type Logger = {
  (event: string, data?: any): void;
  warn: (event: string, data?: any) => void;
  error: (event: string, data?: any, traceId?: string) => void;
  trace: (event: string, traceId: string, data?: any) => void;
};

// =====================================
// 🔹 FORMATTERS
// =====================================

function format(scope: string, level: LogLevel, event: string) {
  const time = new Date().toISOString().split("T")[1].split(".")[0];
  return `[${time}] [${scope}] [${level.toUpperCase()}] ${event}`;
}

// =====================================
// 🔹 LOGGER FACTORY
// =====================================

export function createLogger(scope: string): Logger {
  const base = (event: string, data?: any) => {
    console.log(format(scope, "log", event), data ?? "");
  };

  base.warn = (event: string, data?: any) => {
    console.warn(format(scope, "warn", event), data ?? "");
  };

  base.error = (event: string, data?: any, traceId?: string) => {
    console.error(
      format(scope, "error", event),
      traceId ? { traceId, ...data } : data ?? ""
    );
  };

  base.trace = (event: string, traceId: string, data?: any) => {
    console.log(
      format(scope, "trace", event),
      { traceId, ...(data || {}) }
    );
  };

  return base;
}