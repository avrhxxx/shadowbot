// =====================================
// 📁 src/quickadd/debug/DebugLogger.ts
// =====================================

import { resolveDisplayId } from "../core/IdGenerator";

type Logger = {
  trace: (event: string, traceId: string, data?: any) => void;
  warn: (event: string, traceId: string, data?: any) => void;
  error: (event: string, error: any, traceId: string) => void;
};

const USE_COLORS = true;
const MAX_BUCKET_SIZE = 500;

const C = {
  reset: "\x1b[0m",
  gray: "\x1b[90m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

type TraceLog = {
  time: string;
  group: string;
  scope: string;
  event: string;
  data?: any;
};

const traceBuckets = new Map<string, TraceLog[]>();

function getTime(): string {
  return new Date().toISOString().split("T")[1].split(".")[0];
}

function color(text: string, c: string) {
  return USE_COLORS ? c + text + C.reset : text;
}

function resolveGroup(scope: string): string {
  if (scope.startsWith("OCR")) return "OCR";
  if (scope.startsWith("PARSER")) return "PARSER";
  if (scope.startsWith("VALIDATION")) return "VALIDATION";
  if (scope.startsWith("STORAGE") || scope.startsWith("BUFFER"))
    return "STORAGE";
  if (scope.startsWith("COMMAND")) return "COMMAND";
  if (scope.startsWith("DISCORD")) return "DISCORD";
  return "GENERAL";
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

  if (logs.length >= MAX_BUCKET_SIZE) logs.shift();

  logs.push(entry);
  traceBuckets.set(traceId, logs);
}

// ❗ NOT EXPORTED OUTSIDE logger.ts
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
        group: resolveGroup(scope),
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
        group: resolveGroup(scope),
        scope,
        event,
        data,
      });
    },

    error(event, error, traceId) {
      ensure(traceId);
      push(traceId, {
        time: getTime(),
        group: resolveGroup(scope),
        scope,
        event,
        data: { error },
      });

      flushTrace(traceId);
    },
  };
}