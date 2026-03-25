// =====================================
// 📁 src/quickadd/debug/DebugLogger.ts
// =====================================

/**
 * 🪵 ROLE:
 * Advanced debug logger for QuickAdd system (V5 FINAL).
 *
 * Features:
 * - auto grouping (OCR / PARSER / etc.)
 * - traceId flow (pipeline)
 * - worker tick grouping
 * - clean structured output
 * - file context (scope)
 *
 * ❗ RULES:
 * - NO external deps
 * - NO business logic
 * - backward compatible (no changes needed in other files)
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

type TraceLog = {
  time: string;
  group: string;
  scope: string;
  event: string;
  data?: any;
};

const traceBuckets = new Map<string, TraceLog[]>();

let workerTick = 0;

// =====================================
// 🔹 GROUP RESOLVER
// =====================================

function resolveGroup(scope: string): string {
  if (scope.startsWith("OCR")) return "OCR";
  if (scope.startsWith("PARSER")) return "PARSER";
  if (scope.startsWith("VALIDATION")) return "VALIDATION";
  if (scope.startsWith("REPOSITORY") || scope.startsWith("BUFFER"))
    return "STORAGE";
  if (scope.startsWith("CMD")) return "COMMAND";
  if (scope.startsWith("QA")) return "DISCORD";
  if (scope.startsWith("WORKER")) return "WORKER";
  if (scope.startsWith("CHANNEL")) return "INFRA";

  return "GENERAL";
}

// =====================================
// 🔹 TIME FORMAT
// =====================================

function getTime(): string {
  return new Date().toISOString().split("T")[1].split(".")[0];
}

// =====================================
// 🔹 PRINT TRACE BLOCK
// =====================================

function flushTrace(traceId: string) {
  const logs = traceBuckets.get(traceId);
  if (!logs || !logs.length) return;

  console.log("");
  console.log("════════════════════════════════════════════");
  console.log(`QUICKADD • trace: ${traceId}`);
  console.log("════════════════════════════════════════════\n");

  let currentGroup = "";

  for (const log of logs) {
    if (log.group !== currentGroup) {
      currentGroup = log.group;
      console.log(`[${currentGroup}]`);
    }

    const line = `  [${log.time}] ${log.scope} → ${log.event}`;

    if (log.data && Object.keys(log.data).length > 0) {
      console.log(line, log.data);
    } else {
      console.log(line);
    }
  }

  console.log("\n════════════════════════════════════════════\n");

  traceBuckets.delete(traceId);
}

// =====================================
// 🔹 LOGGER FACTORY
// =====================================

export function createLogger(scope: string): Logger {
  const group = resolveGroup(scope);

  // =====================================
  // 🔹 BASE LOG
  // =====================================

  const base = (event: string, data?: any) => {
    console.log(
      `[${getTime()}] [${group}] ${scope} → ${event}`,
      data ?? ""
    );
  };

  // =====================================
  // 🔹 WARN
  // =====================================

  base.warn = (event: string, data?: any) => {
    console.warn(
      `[${getTime()}] [${group}] ${scope} → ${event}`,
      data ?? ""
    );
  };

  // =====================================
  // 🔹 ERROR
  // =====================================

  base.error = (event: string, data?: any, traceId?: string) => {
    if (traceId) {
      const logs = traceBuckets.get(traceId) || [];

      logs.push({
        time: getTime(),
        group,
        scope,
        event,
        data,
      });

      traceBuckets.set(traceId, logs);
      flushTrace(traceId);
      return;
    }

    console.error(
      `[${getTime()}] [${group}] ${scope} → ${event}`,
      data ?? ""
    );
  };

  // =====================================
  // 🔥 TRACE (SMART)
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

    // =====================================
    // 🔥 WORKER MODE (NO TRACE ID)
    // =====================================

    if (!traceId && group === "WORKER") {
      if (event === "worker_tick") {
        workerTick++;
        console.log("");
        console.log("════════════════════════════════════════════");
        console.log(`WORKER • tick: ${workerTick}`);
        console.log("════════════════════════════════════════════\n");
      }

      const line = `[${getTime()}] ${scope} → ${event}`;

      if (data && Object.keys(data).length > 0) {
        console.log(line, data);
      } else {
        console.log(line);
      }

      return;
    }

    // =====================================
    // 🔥 NORMAL TRACE FLOW
    // =====================================

    if (!traceId) {
      console.log(
        `[${getTime()}] [${group}] ${scope} → ${event}`,
        data ?? ""
      );
      return;
    }

    const logs = traceBuckets.get(traceId) || [];

    logs.push({
      time: getTime(),
      group,
      scope,
      event,
      data,
    });

    traceBuckets.set(traceId, logs);

    // =====================================
    // 🔥 AUTO FLUSH
    // =====================================

    if (
      event === "pipeline_done" ||
      event === "pipeline_error"
    ) {
      flushTrace(traceId);
    }
  };

  base.trace = traceImpl as Logger["trace"];

  return base as Logger;
}