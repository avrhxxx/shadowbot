// =====================================
// 📁 src/quickadd/debug/DebugLogger.ts
// =====================================

/**
 * 🪵 ROLE:
 * STRICT TRACE LOGGER (ENFORCED MODE)
 *
 * ✔ Enforces traceId for ALL trace logs
 * ✔ Groups logs per traceId
 * ✔ Flushes automatically on pipeline end/error
 * ✔ Uses displayId for readable logs
 *
 * ❗ RULES:
 * - traceId REQUIRED (HARD ENFORCEMENT)
 * - NO backward compatibility
 * - NO fallback logging
 * - everything goes through trace system
 */

import { resolveDisplayId } from "../core/IdGenerator";

// =====================================
// 🔹 TYPES
// =====================================

type Logger = {
  (event: string, data?: any): void;
  warn: (event: string, data?: any): void;
  error: (event: string, data?: any, traceId?: string): void;

  trace: (event: string, traceId: string, data?: any) => void;
};

// =====================================
// 🔹 CONFIG
// =====================================

const USE_COLORS = true;

// ANSI COLORS
const C = {
  reset: "\x1b[0m",
  gray: "\x1b[90m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

// =====================================
// 🔹 STATE
// =====================================

type TraceLog = {
  time: string;
  group: string;
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

function color(text: string, c: string) {
  return USE_COLORS ? c + text + C.reset : text;
}

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

function groupColor(group: string): string {
  switch (group) {
    case "OCR":
      return C.magenta;
    case "PARSER":
      return C.cyan;
    case "VALIDATION":
      return C.yellow;
    case "STORAGE":
      return C.gray;
    case "COMMAND":
      return C.cyan;
    case "DISCORD":
      return C.gray;
    case "WORKER":
      return C.yellow;
    case "INFRA":
      return C.gray;
    default:
      return C.gray;
  }
}

// =====================================
// 🔹 TRACE FLUSH
// =====================================

function flushTrace(traceId: string) {
  const logs = traceBuckets.get(traceId);
  if (!logs || !logs.length) return;

  const displayId = resolveDisplayId(traceId);

  console.log("");

  console.log(
    color(
      `========== QUICKADD TRACE (${displayId}) ==========`,
      C.cyan
    )
  );
  console.log("");

  let currentGroup = "";

  for (const log of logs) {
    if (log.group !== currentGroup) {
      currentGroup = log.group;

      console.log(
        color("[" + currentGroup + "]", groupColor(currentGroup))
      );
    }

    const line =
      "  " +
      color(log.time, C.gray) +
      " | " +
      log.scope +
      " | " +
      log.event;

    if (log.data && Object.keys(log.data).length > 0) {
      console.log(line, log.data);
    } else {
      console.log(line);
    }
  }

  console.log("");
  console.log(color("============================================", C.cyan));
  console.log("");

  traceBuckets.delete(traceId);
}

// =====================================
// 🔹 LOGGER FACTORY
// =====================================

export function createLogger(scope: string): Logger {
  const group = resolveGroup(scope);

  const base = (event: string, data?: any) => {
    console.log(
      color("[" + getTime() + "]", C.gray) +
        " [" +
        color(group, groupColor(group)) +
        "] " +
        scope +
        " -> " +
        event,
      data ?? ""
    );
  };

  base.warn = (event: string, data?: any) => {
    console.warn(
      color("[" + getTime() + "]", C.gray) +
        " [" +
        color(group, C.yellow) +
        "] " +
        scope +
        " -> " +
        event,
      data ?? ""
    );
  };

  // =====================================
  // 🔥 STRICT ERROR (TRACE ENFORCED)
  // =====================================

  base.error = (event: string, data?: any, traceId?: string) => {
    if (!traceId) {
      throw new Error(
        `[TRACE ERROR] Missing traceId in ${scope} for error: ${event}`
      );
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
    flushTrace(traceId);
  };

  // =====================================
  // 🔥 STRICT TRACE (ENFORCED)
  // =====================================

  const traceImpl = (
    event: string,
    traceId: string,
    data?: any
  ) => {
    if (!traceId) {
      throw new Error(
        `[TRACE ERROR] Missing traceId in ${scope} for event: ${event}`
      );
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

    if (
      event === "pipeline_done" ||
      event === "pipeline_error"
    ) {
      flushTrace(traceId);
    }
  };

  base.trace = traceImpl;

  return base as Logger;
}