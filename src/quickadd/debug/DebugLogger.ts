// =====================================
// 📁 src/quickadd/debug/DebugLogger.ts
// =====================================

/**
 * 🪵 ROLE:
 * DUAL MODE LOGGER (TRACE + SYSTEM) — FINAL (FLOW AWARE)
 *
 * ✔ TRACE MODE:
 * - traceId REQUIRED
 * - grouped logs (buckets)
 * - flushed on terminal events
 *
 * ✔ SYSTEM MODE:
 * - no traceId
 * - direct console output
 *
 * 🔥 NEW:
 * - flowType support (USER | SYSTEM)
 *
 * ❗ RULES:
 * - DO NOT fake traceId
 * - use correct mode depending on context
 */

import { resolveDisplayId } from "../core/IdGenerator";

// =====================================
// 🔹 TYPES
// =====================================

export type FlowType = "USER" | "SYSTEM";

type TraceLogger = {
  trace: (event: string, traceId: string, data?: any) => void;
  warn: (event: string, traceId: string, data?: any) => void;
  error: (event: string, error: any, traceId: string) => void;
};

type SystemLogger = {
  log: (event: string, data?: any) => void;
  warn: (event: string, data?: any) => void;
  error: (event: string, error?: any) => void;
};

// =====================================
// 🔹 CONFIG
// =====================================

const MAX_BUCKET_SIZE = 500;

// =====================================
// 🔹 STATE
// =====================================

type TraceLog = {
  time: string;
  scope: string;
  flow: FlowType;
  event: string;
  data?: any;
};

const traceBuckets = new Map<string, TraceLog[]>();

// =====================================
// 🔹 HELPERS
// =====================================

function getTime(): string {
  return new Date().toISOString().split("T")[1].split(".")[0];
}

function flushTrace(traceId: string) {
  const logs = traceBuckets.get(traceId);
  if (!logs?.length) return;

  const displayId = resolveDisplayId(traceId);

  console.log(`\n========== TRACE (${displayId}) ==========\n`);

  for (const log of logs) {
    console.log(
      `${log.time} | ${log.scope} | [${log.flow}] | ${log.event}`,
      log.data || ""
    );
  }

  console.log("\n=========================================\n");

  traceBuckets.delete(traceId);
}

function push(traceId: string, entry: TraceLog) {
  const logs = traceBuckets.get(traceId) || [];

  if (logs.length >= MAX_BUCKET_SIZE) {
    logs.shift();
  }

  logs.push(entry);
  traceBuckets.set(traceId, logs);
}

// =====================================
// 🔒 TRACE LOGGER
// =====================================

export function __createTraceLogger(
  scope: string,
  flow: FlowType
): TraceLogger {
  function ensure(traceId: string) {
    if (!traceId) {
      throw new Error(`[TRACE ERROR] Missing traceId in ${scope}`);
    }
  }

  return {
    trace(event, traceId, data) {
      ensure(traceId);

      push(traceId, {
        time: getTime(),
        scope,
        flow,
        event,
        data,
      });

      if (event === "pipeline_done" || event === "pipeline_error") {
        flushTrace(traceId);
      }
    },

    warn(event, traceId, data) {
      ensure(traceId);

      push(traceId, {
        time: getTime(),
        scope,
        flow,
        event,
        data,
      });
    },

    error(event, error, traceId) {
      ensure(traceId);

      push(traceId, {
        time: getTime(),
        scope,
        flow,
        event,
        data: { error },
      });

      flushTrace(traceId);
    },
  };
}

// =====================================
// 🔓 SYSTEM LOGGER
// =====================================

export function __createSystemLogger(
  scope: string,
  flow: FlowType
): SystemLogger {
  return {
    log(event, data) {
      console.log(
        `${getTime()} | ${scope} | [${flow}] | ${event}`,
        data || ""
      );
    },
    warn(event, data) {
      console.warn(
        `${getTime()} | ${scope} | [${flow}] | ${event}`,
        data || ""
      );
    },
    error(event, error) {
      console.error(
        `${getTime()} | ${scope} | [${flow}] | ${event}`,
        error || ""
      );
    },
  };
}