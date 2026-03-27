// =====================================
// 📁 src/quickadd/debug/DebugLogger.ts
// =====================================

/**
 * 🪵 ROLE:
 * Core logging engine (EVENT-BASED).
 *
 * ❗ IMPORTANT:
 * - ONLY works with emit(eventObject)
 * - NO knowledge about business layer
 * - FULLY replaceable without refactor
 */

import { resolveDisplayId } from "../core/IdGenerator";
import { LOGGER_CONFIG } from "./LoggerConfig";
import { getTime } from "./LoggerRuntime";

// =====================================
// 🔹 TYPES
// =====================================

type LogLevel = "trace" | "warn" | "error" | "system";

type LogEvent = {
  scope: string;
  event: string;
  traceId?: string;
  data?: any;
  level?: LogLevel;
};

// =====================================
// 🔹 STATE
// =====================================

const buckets = new Map<string, LogEvent[]>();

// =====================================
// 🔹 INTERNAL
// =====================================

function push(traceId: string, entry: LogEvent) {
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
      `${getTime()} | ${log.scope} | ${log.event}`,
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
    if (!LOGGER_CONFIG.ENABLE_LOGS) return;

    const level = input.level || "trace";

    // =====================================
    // SYSTEM LOG (NO TRACE)
    // =====================================
    if (level === "system" || !input.traceId) {
      if (!LOGGER_CONFIG.ENABLE_SYSTEM) return;

      console.log(
        `${getTime()} | ${input.scope}:SYSTEM | ${input.event}`,
        input.data || ""
      );

      return;
    }

    // =====================================
    // TRACE LOG
    // =====================================
    if (!LOGGER_CONFIG.ENABLE_TRACE) return;

    push(input.traceId, input);

    if (LOGGER_CONFIG.FLUSH_EVENTS.includes(input.event)) {
      flush(input.traceId);
    }

    if (level === "error") {
      flush(input.traceId);
    }
  },
};