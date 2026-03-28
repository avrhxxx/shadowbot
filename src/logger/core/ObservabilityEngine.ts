// =====================================
// 📁 src/logger/core/ObservabilityEngine.ts
// =====================================

import { getTime } from "../runtime/Time";
import { resolveScope } from "../runtime/ScopeResolver";
import {
  InternalLog,
  LogInput,
} from "../observability/ObservabilityTypes";

// =====================================
// 🔹 STATE
// =====================================

const buckets = new Map<string, InternalLog[]>();
const MAX_BUCKET_SIZE = 500;

// =====================================
// 🔹 INTERNAL
// =====================================

function push(traceId: string, entry: InternalLog) {
  const logs = buckets.get(traceId) || [];

  if (logs.length >= MAX_BUCKET_SIZE) {
    logs.shift();
  }

  logs.push(entry);
  buckets.set(traceId, logs);
}

function flush(traceId: string) {
  const logs = buckets.get(traceId);
  if (!logs?.length) return;

  console.log(`\n========== TRACE (${traceId}) ==========\n`);

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
// 🔥 ENGINE
// =====================================

export const ObservabilityEngine = {
  emit(input: LogInput) {
    const {
      event,
      traceId,
      data,
      level = "info",
      type = "user",
    } = input;

    const scope = resolveScope();

    // =============================
    // NO TRACE → direct log
    // =============================
    if (!traceId) {
      console.log(
        `${getTime()} | ${scope}:${type} | ${level} | ${event}`,
        data || ""
      );
      return;
    }

    // =============================
    // TRACE MODE
    // =============================
    push(traceId, {
      time: getTime(),
      scope,
      event,
      level,
      type,
      data,
    });

    // =============================
    // AUTO FLUSH
    // =============================
    if (
      event.endsWith("_done") ||
      event.endsWith("_failed") ||
      level === "error"
    ) {
      flush(traceId);
    }
  },
};