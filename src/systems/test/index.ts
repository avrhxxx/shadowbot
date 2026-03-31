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

  const flow = log.system("test").flow("test.lifecycle");

  flow.start();

  try {
    // =====================================
    // 🔹 STEP 1
    // =====================================

    flow.stepInfo("init.start");

    await new Promise((res) => setTimeout(res, 100));

    // =====================================
    // 🔹 STEP 2 (FAKE LOGIC)
    // =====================================

    flow.stepDebug("processing", {
      input: { example: "hello" },
    });

    await new Promise((res) => setTimeout(res, 150));

    // =====================================
    // 🔹 STEP 3 (RESULT)
    // =====================================

    flow.stepInfo("done", {
      result: { status: "ok" },
    });

    flow.success();
  } catch (err) {
    flow.fail(err);
  }
}