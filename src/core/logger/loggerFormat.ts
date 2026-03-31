import type { LogPayload } from "./loggerTypes.js";

// =====================================
// 🎨 COLORS
// =====================================

const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  gray: "\x1b[90m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
};

// =====================================
// 🔧 HELPERS
// =====================================

function getLevelColor(level: string) {
  switch (level) {
    case "fatal":
    case "error":
      return COLORS.red;
    case "warn":
      return COLORS.yellow;
    case "info":
      return COLORS.green;
    default:
      return COLORS.gray;
  }
}

function clean<T>(obj: T): T | undefined {
  if (!obj || typeof obj !== "object") return obj;

  const entries = Object.entries(obj).filter(
    ([, v]) => v !== undefined && v !== null
  );

  if (!entries.length) return undefined;

  return Object.fromEntries(entries) as T;
}

function normalizeError(err: unknown) {
  if (!err) return undefined;

  if (err instanceof Error) {
    return {
      message: err.message,
      stack: err.stack,
    };
  }

  return {
    message: String(err),
  };
}

function shortId(id?: string) {
  if (!id) return "-";
  return id.split("-")[1]?.slice(0, 4) ?? id;
}

// =====================================
// 🔥 FORMATTER (PURE)
// =====================================

export function loggerFormat(payload: LogPayload) {
  const level = payload.level ?? "info";
  const color = getLevelColor(level);

  const time = payload.timestamp ?? new Date().toISOString();
  const scope = payload.scope ?? "unknown";

  const header =
    `${COLORS.dim}${time}${COLORS.reset} ` +
    `${color}[${level.toUpperCase()}]${COLORS.reset} ` +
    `${COLORS.cyan}[${scope}]${COLORS.reset} ` +
    `${payload.event} ` +
    `${COLORS.gray}(t-${shortId(payload.traceId)})${COLORS.reset}`;

  const lines: Array<[string, unknown]> = [];

  if (payload.tags) lines.push(["tags", payload.tags]);

  if (payload.context) lines.push(["context", clean(payload.context)]);
  if (payload.input) lines.push(["input", clean(payload.input)]);
  if (payload.result) lines.push(["result", clean(payload.result)]);

  const error = normalizeError(payload.error);
  if (error) lines.push(["error", error]);

  if (payload.timing) lines.push(["timing", payload.timing]);
  if (payload.durationMs) lines.push(["duration", payload.durationMs]);

  if (payload.stats) lines.push(["stats", payload.stats]);
  if (payload.metrics) lines.push(["metrics", payload.metrics]);
  if (payload.meta) lines.push(["meta", payload.meta]);

  if (payload.flow) lines.push(["flow", payload.flow]);
  if (payload.decision) lines.push(["decision", payload.decision]);

  if (payload.interaction)
    lines.push(["interaction", payload.interaction]);

  if (payload.trace) lines.push(["trace", payload.trace]);

  return {
    header,
    lines,
  };
}