// =====================================
// 📁 src/systems/test/index.ts
// =====================================

import { createLogger } from "@/foundation/logger";
import type { TraceContext } from "@/trace";

// =====================================
// 🚀 INIT
// =====================================

export async function init(ctx: TraceContext): Promise<void> {
  const log = createLogger(ctx);

  const flow = log.flow("lifecycle");

  flow.start();

  try {
    // =====================================
    // 🔹 STEP 1
    // =====================================

    flow.stepInfo("init.started");

    await new Promise((res) => setTimeout(res, 100));

    // =====================================
    // 🔹 STEP 2
    // =====================================

    flow.stepDebug("processing.data", {
      input: { example: "hello" },
    });

    await new Promise((res) => setTimeout(res, 150));

    // =====================================
    // 🔹 STEP 3
    // =====================================

    flow.stepInfo("processing.completed", {
      result: { status: "ok" },
    });

    flow.success();
  } catch (err) {
    flow.fail(err);
  }
}