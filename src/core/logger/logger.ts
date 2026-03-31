// =====================================
// 📁 src/core/logger/logger.ts
// =====================================

import type { TraceContext } from "../trace/traceTypes.js";
import type { LogPayload } from "./loggerTypes.js";

import { createLoggerCtx } from "./loggerCtx.js";
import { createLoggerAuto } from "./loggerAuto.js";
import { createLoggerFlow } from "./loggerFlow.js";

// =====================================
// 🔹 ROOT LOG FUNCTION (RARELY USED)
// =====================================

function baseLog(
  ctx: TraceContext,
  event: string,
  payload?: Omit<LogPayload, "event" | "traceId">
) {
  const l = createLoggerCtx(ctx);
  l.event(event, payload);
}

// =====================================
// 🔥 MAIN LOGGER API (B3)
// =====================================

export const log = Object.assign(baseLog, {
  // =====================================
  // 🔹 CTX (PRIMARY ENTRYPOINT)
  // =====================================

  ctx(ctx: TraceContext) {
    const base = createLoggerCtx(ctx);

    return {
      ...base,

      // 🔥 AUTO
      auto: createLoggerAuto(base),

      // 🔥 FLOW
      flow: createLoggerFlow(base),
    };
  },
});