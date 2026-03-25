// =====================================
// 📁 src/quickadd/debug/DebugLogger.ts
// =====================================

/**
 * 🪵 ROLE:
 * Advanced logging system (V3)
 *
 * Features:
 * - grouped logs by traceId
 * - automatic sections (OCR, PARSER, STORAGE, etc.)
 * - pretty console output (boxed groups)
 * - backward compatible (no changes required in other files)
 *
 * ❗ RULES:
 * - zero business logic
 * - lightweight
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

// =====================================
// 🔹 INTERNAL STATE
// =====================================

type LogEntry = {
  scope: string;
  level: LogLevel;
  event: string;
  time: string;
  data?: any;
};

const TRACE_STORE = new Map<string, LogEntry[]>();

// =====================================
// 🔹 HELPERS
// =====================================

function now() {
  return new Date().toISOString().split("T")[1].split(".")[0];
}

function formatLine(entry: LogEntry) {
  const dataStr =
    entry.data && Object.keys(entry.data).length
      ? " " + JSON.stringify(entry.data)
      : "";

  return `  [${entry.time}] ${entry.event}${dataStr}`;
}

// 🔥 GROUP BY SCOPE (OCR / PARSER / STORAGE etc.)
function groupByScope(entries: LogEntry[]) {
  const map: Record<string, LogEntry[]> = {};

  for (const e of entries) {
    if (!map[e.scope]) map[e.scope] = [];
    map[e.scope].push(e);
  }

  return map;
}

// =====================================
// 🔹 FLUSH (PRINT GROUP)
// =====================================

function flushTrace(traceId: string) {
  const entries = TRACE_STORE.get(traceId);
  if (!entries || !entries.length) return;

  const grouped = groupByScope(entries);

  console.log("\n════════════════════════════════════════════");
  console.log(`QUICKADD • trace: ${traceId}`);
  console.log("════════════════════════════════════════════\n");

  for (const scope of Object.keys(grouped)) {
    console.log(`[${scope}]`);

    for (const entry of grouped[scope]) {
      console.log(formatLine(entry));
    }

    console.log("");
  }

  console.log("════════════════════════════════════════════\n");

  TRACE_STORE.delete(traceId);
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
  // 🔥 TRACE (GROUPED MODE)
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

    const entry: LogEntry = {
      scope,
      level: "trace",
      event,
      time: now(),
      data,
    };

    // =====================================
    // 🔥 WITH TRACE → GROUP
    // =====================================
    if (traceId) {
      if (!TRACE_STORE.has(traceId)) {
        TRACE_STORE.set(traceId, []);
      }

      TRACE_STORE.get(traceId)!.push(entry);

      // 🔥 AUTO FLUSH ON FINAL EVENTS
      if (
        event.includes("done") ||
        event.includes("success") ||
        event.includes("failed")
      ) {
        flushTrace(traceId);
      }

      return;
    }

    // =====================================
    // 🔹 WITHOUT TRACE → NORMAL LOG
    // =====================================
    console.log(
      `[${entry.time}] [${scope}] TRACE ${event}`,
      data ?? ""
    );
  };

  base.trace = traceImpl as Logger["trace"];

  return base as Logger;
}