// =====================================
// 📁 src/quickadd/debug/DebugLogger.ts
// =====================================

/**
 * 🪵 ROLE (V2):
 * Pretty structured logger with trace grouping.
 *
 * Features:
 * - backward compatible (no code changes needed)
 * - groups logs per traceId
 * - pretty console output (sections + separators)
 * - scoped logging (OCR, PARSER, etc.)
 *
 * ❗ RULES:
 * - no business logic
 * - lightweight (no deps)
 */

// =====================================
// 🔹 TYPES
// =====================================

type LogLevel = "log" | "warn" | "error" | "trace";

type Logger = {
  (event: string, data?: any): void;
  warn: (event: string, data?: any) => void;
  error: (event: string, data?: any, traceId?: string) => void;

  trace: {
    (event: string, data?: any): void;
    (event: string, traceId: string, data?: any): void;
  };
};

type TraceBuffer = {
  scopes: Map<string, string[]>;
  lastFlush: number;
};

// =====================================
// 🔹 CONFIG
// =====================================

const FLUSH_DELAY = 50; // ms (group burst logs)

// =====================================
// 🔹 INTERNAL STATE
// =====================================

const traces = new Map<string, TraceBuffer>();

// =====================================
// 🔹 HELPERS
// =====================================

function now() {
  return new Date().toISOString().split("T")[1].split(".")[0];
}

function formatLine(event: string, data?: any) {
  if (!data || Object.keys(data).length === 0) {
    return `  [${now()}] ${event}`;
  }

  return `  [${now()}] ${event} ${JSON.stringify(data)}`;
}

function ensureTrace(traceId: string): TraceBuffer {
  if (!traces.has(traceId)) {
    traces.set(traceId, {
      scopes: new Map(),
      lastFlush: Date.now(),
    });
  }
  return traces.get(traceId)!;
}

function scheduleFlush(traceId: string) {
  const trace = traces.get(traceId);
  if (!trace) return;

  const nowTime = Date.now();

  if (nowTime - trace.lastFlush > FLUSH_DELAY) {
    flush(traceId);
    return;
  }

  setTimeout(() => flush(traceId), FLUSH_DELAY);
}

function flush(traceId: string) {
  const trace = traces.get(traceId);
  if (!trace) return;

  console.log("\n════════════════════════════════════════════");
  console.log(`QUICKADD • trace: ${traceId}`);
  console.log("════════════════════════════════════════════\n");

  for (const [scope, lines] of trace.scopes.entries()) {
    console.log(`[${scope}]`);
    for (const line of lines) {
      console.log(line);
    }
    console.log("");
  }

  console.log("════════════════════════════════════════════\n");

  traces.delete(traceId);
}

// =====================================
// 🔹 LOGGER FACTORY
// =====================================

export function createLogger(scope: string): Logger {
  const base = (event: string, data?: any) => {
    console.log(`[${now()}] [${scope}] ${event}`, data ?? "");
  };

  base.warn = (event: string, data?: any) => {
    console.warn(`[${now()}] [${scope}] WARN ${event}`, data ?? "");
  };

  base.error = (event: string, data?: any, traceId?: string) => {
    console.error(
      `[${now()}] [${scope}] ERROR ${event}`,
      traceId ? { traceId, ...(data || {}) } : data ?? ""
    );
  };

  // =====================================
  // 🔥 TRACE (GROUPED)
  // =====================================

  const traceImpl = (
    event: string,
    arg1?: any,
    arg2?: any
  ) => {
    let traceId: string | undefined;
    let data: any;

    if (typeof arg1 === "string") {
      traceId = arg1;
      data = arg2;
    } else {
      data = arg1;
    }

    // 🔹 NO TRACE ID → fallback to normal log
    if (!traceId) {
      console.log(`[${now()}] [${scope}] TRACE ${event}`, data ?? "");
      return;
    }

    const trace = ensureTrace(traceId);

    if (!trace.scopes.has(scope)) {
      trace.scopes.set(scope, []);
    }

    trace.scopes.get(scope)!.push(formatLine(event, data));

    trace.lastFlush = Date.now();

    scheduleFlush(traceId);
  };

  base.trace = traceImpl as Logger["trace"];

  return base as Logger;
}