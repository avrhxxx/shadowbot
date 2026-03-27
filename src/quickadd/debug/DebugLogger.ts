// =====================================
// 📁 src/quickadd/debug/DebugLogger.ts
// =====================================

/**
 * 🪵 ROLE:
 * TRACE LOGGER (FINAL v3 — TRACE TYPE AWARE)
 *
 * ✔ SINGLE ID SYSTEM (traceId ONLY)
 * ✔ traceType: USER | SYSTEM (metadata)
 * ✔ bucketed logs
 * ✔ auto flush on terminal events
 *
 * ❗ RULES:
 * - traceId REQUIRED
 * - NO fake IDs
 * - traceType NOT part of ID
 */

import { resolveDisplayId } from "../core/IdGenerator";

// =====================================
// 🔹 TYPES
// =====================================

export type TraceType = "USER" | "SYSTEM";

type TraceLogger = {
  trace: (event: string, traceId: string, data?: any) => void;
  warn: (event: string, traceId: string, data?: any) => void;
  error: (event: string, error: any, traceId: string) => void;
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
  traceType: TraceType;
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
      `${log.time} | ${log.scope} | [${log.traceType}] | ${log.event}`,
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
  traceType: TraceType
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
        traceType,
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
        traceType,
        event,
        data,
      });
    },

    error(event, error, traceId) {
      ensure(traceId);

      push(traceId, {
        time: getTime(),
        scope,
        traceType,
        event,
        data: { error },
      });

      flushTrace(traceId);
    },
  };
}