// =====================================
// 📁 src/observability/core/ObservabilityEngine.ts
// =====================================

import { resolveScope } from "../runtime/ScopeResolver";
import { getTime } from "../runtime/Time";

// =====================================
// 🔹 TYPES
// =====================================

type LogLevel = "info" | "warn" | "error";
type TraceType = "user" | "system";

type LogInput = {
  event: string;
  traceId?: string;
  data?: any;

  level?: LogLevel;
  type?: TraceType;

  system?: string;
  layer?: string;
};

type InternalLog = {
  time: string;
  scope: string;
  event: string;
  level: LogLevel;
  type: TraceType;

  system?: string;
  layer?: string;

  data?: any;
};

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
    const system = log.system
      ? `[${log.system.toUpperCase()}]`
      : "";

    const layer = log.layer
      ? `[${log.layer.toUpperCase()}]`
      : "";

    console.log(
      `${log.time} | ${system} ${layer} | ${log.level} | ${log.event}`,
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
      system,
      layer,
    } = input;

    const scope = resolveScope();

    // =====================================
    // 🔹 DIRECT LOG (NO TRACE)
    // =====================================

    if (!traceId) {
      console.log(
        `${getTime()} | ${scope}:${type} | ${level} | ${event}`,
        data || ""
      );
      return;
    }

    // =====================================
    // 🔹 TRACE LOG (BUFFERED)
    // =====================================

    push(traceId, {
      time: getTime(),
      scope,
      event,
      level,
      type,
      system,
      layer,
      data,
    });

    // =====================================
    // 🔹 AUTO FLUSH
    // =====================================

    if (level === "error" || event.endsWith("_done")) {
      flush(traceId);
    }
  },
};