// =====================================
// 📁 src/quickadd/debug/DebugLogger.ts
// =====================================

/**
 * 🪵 ROLE:
 * Core logging engine (EVENT-BASED, FINAL).
 *
 * ❗ IMPORTANT:
 * - ONLY works with log.emit({...})
 * - NO scope passed from outside (auto-resolved)
 * - supports:
 *    - trace logs (buffered)
 *    - system + user flows
 *    - levels (info/warn/error)
 *
 * ✅ DESIGN:
 * - fully replaceable
 * - zero refactor impact on business files
 * - unified trace model (no special systemId)
 */

import { resolveDisplayId } from "../core/IdGenerator";
import { LOGGER_CONFIG } from "./LoggerConfig";
import { getTime, resolveScope } from "./LoggerRuntime";

// =====================================
// 🔹 TYPES
// =====================================

type LogLevel = "info" | "warn" | "error";
type TraceType = "user" | "system";

type LogEvent = {
  event: string;
  traceId?: string;
  data?: any;

  level?: LogLevel;
  type?: TraceType;
};

type InternalLog = {
  time: string;
  scope: string;
  event: string;
  level: LogLevel;
  type: TraceType;
  data?: any;
};

// =====================================
// 🔹 STATE
// =====================================

const buckets = new Map<string, InternalLog[]>();

// =====================================
// 🔹 INTERNAL HELPERS
// =====================================

function push(traceId: string, entry: InternalLog) {
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
      `${log.time} | ${log.scope}:${log.type} | ${log.level} | ${log.event}`,
      log.data || ""
    );
  }

  console.log("\n=========================================\n");

  buckets.delete(traceId);
}

// =====================================
// 🔥 CORE ENGINE
// =====================================

export const DebugLogger = {
  emit(input: LogEvent) {
    const {
      event,
      traceId,
      data,
      level = "info",
      type = "user",
    } = input;

    const scope = resolveScope();

    // =====================================
    // 🔹 DIRECT LOG (NO TRACE)
    // =====================================

    if (!traceId) {
      if (!LOGGER_CONFIG.ENABLE_SYSTEM) return;

      console.log(
        `${getTime()} | ${scope}:${type} | ${level} | ${event}`,
        data || ""
      );

      return;
    }

    // =====================================
    // 🔹 TRACE LOG (BUFFERED)
    // =====================================

    if (!LOGGER_CONFIG.ENABLE_TRACE) return;

    push(traceId, {
      time: getTime(),
      scope,
      event,
      level,
      type,
      data,
    });

    // =====================================
    // 🔹 FLUSH CONDITIONS
    // =====================================

    if (
      LOGGER_CONFIG.FLUSH_EVENTS.includes(event) ||
      level === "error"
    ) {
      flush(traceId);
    }
  },
};