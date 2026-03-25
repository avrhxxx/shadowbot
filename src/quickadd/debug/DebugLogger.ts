// =====================================
// 📁 src/quickadd/debug/DebugLogger.ts
// =====================================

/**
 * 🪵 ROLE:
 * Advanced structured logger (V4 FINAL).
 *
 * Features:
 * - scoped logs (OCR, PARSER, etc.)
 * - auto trace grouping (by traceId)
 * - section grouping ([OCR], [PARSER], etc.)
 * - auto START / END block rendering
 * - backward compatible (NO code changes required)
 *
 * Output example:
 *
 * ════════════════════════════════════════════
 * QUICKADD • trace: abc123
 * ════════════════════════════════════════════
 *
 * [OCR]
 *   [12:01:22] ocr_start
 *   [12:01:23] image_loaded { size: 482133 }
 *
 * [PARSER]
 *   [12:01:26] parsed { entries: 18 }
 *
 * ════════════════════════════════════════════
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
// 🔹 INTERNAL TRACE STATE
// =====================================

type TraceState = {
  started: boolean;
  lastActivity: number;
  sections: Set<string>;
};

const traces = new Map<string, TraceState>();

const TRACE_TIMEOUT = 5000; // auto close after inactivity

// =====================================
// 🔹 HELPERS
// =====================================

function now() {
  return new Date().toISOString().split("T")[1].split(".")[0];
}

function separator() {
  return "════════════════════════════════════════════";
}

function printHeader(traceId: string) {
  console.log("");
  console.log(separator());
  console.log(`QUICKADD • trace: ${traceId}`);
  console.log(separator());
  console.log("");
}

function printFooter() {
  console.log("");
  console.log(separator());
  console.log("");
}

function ensureTrace(traceId: string) {
  let state = traces.get(traceId);

  if (!state) {
    state = {
      started: false,
      lastActivity: Date.now(),
      sections: new Set(),
    };
    traces.set(traceId, state);
  }

  if (!state.started) {
    printHeader(traceId);
    state.started = true;
  }

  state.lastActivity = Date.now();

  scheduleCleanup(traceId);

  return state;
}

function scheduleCleanup(traceId: string) {
  setTimeout(() => {
    const state = traces.get(traceId);
    if (!state) return;

    const inactive = Date.now() - state.lastActivity > TRACE_TIMEOUT;

    if (inactive) {
      printFooter();
      traces.delete(traceId);
    }
  }, TRACE_TIMEOUT + 100);
}

function printSection(state: TraceState, scope: string) {
  if (!state.sections.has(scope)) {
    console.log(`[${scope}]`);
    state.sections.add(scope);
  }
}

function formatLine(event: string, data?: any) {
  if (!data || Object.keys(data).length === 0) {
    return `  [${now()}] ${event}`;
  }
  return `  [${now()}] ${event} ${JSON.stringify(data)}`;
}

// =====================================
// 🔹 LOGGER FACTORY
// =====================================

export function createLogger(scope: string): Logger {
  const base = (event: string, data?: any) => {
    console.log(`[${now()}] [${scope}] ${event}`, data ?? "");
  };

  base.warn = (event: string, data?: any) => {
    console.warn(`[${now()}] [${scope}] ⚠️ ${event}`, data ?? "");
  };

  base.error = (event: string, data?: any, traceId?: string) => {
    if (traceId) {
      const state = ensureTrace(traceId);
      printSection(state, scope);
      console.error(formatLine(`❌ ${event}`, data));
      return;
    }

    console.error(`[${now()}] [${scope}] ❌ ${event}`, data ?? "");
  };

  // =====================================
  // 🔥 TRACE (AUTO GROUPING)
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

    if (!traceId) {
      console.log(`[${now()}] [${scope}] ${event}`, data ?? "");
      return;
    }

    const state = ensureTrace(traceId);

    printSection(state, scope);

    console.log(formatLine(event, data));
  };

  base.trace = traceImpl as Logger["trace"];

  return base as Logger;
}