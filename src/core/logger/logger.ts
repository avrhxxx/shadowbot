// =====================================
// 📁 src/core/logger/logger.ts
// =====================================

import type { TraceContext } from "../trace/traceTypes.js";
import type { LogPayload } from "./loggerTypes.js";

import { createLoggerCtx } from "./loggerCtx.js";
import { createLoggerAuto } from "./loggerAuto.js";
import { createLoggerFlow } from "./loggerFlow.js";

// =====================================
// 🔧 LOGGER FACTORY
// =====================================

function createLogger(ctx: TraceContext) {
  const base = createLoggerCtx(ctx);

  return {
    ...base,

    // 🔥 B3
    auto: createLoggerAuto(base),
    flow: createLoggerFlow(base),
  };
}

// =====================================
// 🔹 ROOT LOG FUNCTION (RARELY USED)
// =====================================

function baseLog(
  ctx: TraceContext,
  event: string,
  payload?: Omit<LogPayload, "event" | "traceId">
) {
  createLogger(ctx).event(event, payload);
}

// =====================================
// 🔥 MAIN LOGGER API (B3)
// =====================================

export const log = Object.assign(baseLog, {
  // 🔹 PRIMARY ENTRYPOINT
  ctx: createLogger,
});