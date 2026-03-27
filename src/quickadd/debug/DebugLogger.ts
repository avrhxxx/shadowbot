// =====================================
// 📁 src/quickadd/debug/DebugLogger.ts
// =====================================

/**
 * 🪵 ROLE:
 * STRICT TRACE LOGGER (ENFORCED MODE — FINAL)
 *
 * ✔ ONE unified API
 * ✔ traceId REQUIRED for ALL logs
 * ✔ Groups logs per traceId
 * ✔ Flushes on terminal events
 * ✔ Uses displayId
 *
 * ❗ RULES:
 * - NOT exported directly
 * - ONLY used via createScopedLogger
 */

import { resolveDisplayId } from "../core/IdGenerator";

// =====================================
// 🔹 TYPES
// =====================================

type Logger = {
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
      `${log.time} | ${log.scope} | ${log.event}`,
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
// 🔒 INTERNAL LOGGER (NOT EXPORTED)
// =====================================

export function __createLoggerInternal(scope: string): Logger {
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
        event,
        data,
      });
    },

    error(event, error, traceId) {
      ensure(traceId);

      push(traceId, {
        time: getTime(),
        scope,
        event,
        data: { error },
      });

      flushTrace(traceId);
    },
  };
}