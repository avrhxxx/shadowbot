// =====================================
// 📁 src/quickadd/debug/DebugLogger.ts
// =====================================

/**
 * 🪵 ROLE:
 * Core logging engine (TRACE + SYSTEM).
 *
 * Responsible for:
 * - buffering trace logs (grouped by traceId)
 * - flushing logs on terminal events
 * - handling system logs (background processes)
 *
 * ❗ RULES:
 * - traceId REQUIRED for trace logs
 * - NO traceId fallback
 * - SYSTEM logs do NOT use traceId
 * - NO external dependencies (except IdGenerator)
 *
 * 🔥 TRACE TYPES:
 * - "user"   → user flow
 * - "system" → background flow
 *
 * ✅ FINAL:
 * - zero config needed in business files
 * - works via global facade (logger.ts)
 */

import { resolveDisplayId } from "../core/IdGenerator";
import { LOGGER_CONFIG } from "./LoggerConfig";
import { resolveScope, getTime } from "./LoggerRuntime";

type TraceType = "user" | "system";

type TraceLog = {
  time: string;
  scope: string;
  event: string;
  data?: any;
};

const buckets = new Map<string, TraceLog[]>();

function push(traceId: string, entry: TraceLog) {
  const logs = buckets.get(traceId) || [];

  if (logs.length >= LOGGER_CONFIG.MAX_BUCKET_SIZE) {
    logs.shift();
  }

  logs.push(entry);
  buckets.set(traceId, logs);
}

function flush(traceId: string) {
  const logs = buckets.get(traceId);
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

  buckets.delete(traceId);
}

function ensure(traceId?: string) {
  if (!traceId) {
    throw new Error("Missing traceId");
  }
}

export const log = {
  trace(
    event: string,
    traceId: string,
    data?: any,
    type: TraceType = "user"
  ) {
    if (!LOGGER_CONFIG.ENABLE_TRACE) return;

    ensure(traceId);

    const scope = resolveScope();

    push(traceId, {
      time: getTime(),
      scope: `${scope}:${type}`,
      event,
      data,
    });

    if (LOGGER_CONFIG.FLUSH_EVENTS.includes(event)) {
      flush(traceId);
    }
  },

  warn(event: string, traceId: string, data?: any) {
    this.trace(event, traceId, data);
  },

  error(event: string, error: any, traceId: string) {
    ensure(traceId);

    const scope = resolveScope();

    push(traceId, {
      time: getTime(),
      scope,
      event,
      data: { error },
    });

    flush(traceId);
  },

  system(event: string, data?: any) {
    if (!LOGGER_CONFIG.ENABLE_SYSTEM) return;

    const scope = resolveScope();

    console.log(
      `${getTime()} | ${scope}:SYSTEM | ${event}`,
      data || ""
    );
  },
};