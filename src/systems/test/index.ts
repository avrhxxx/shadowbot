// =====================================
// 📁 src/systems/test/index.ts
// =====================================

/**
 * 🧠 ROLE:
 * Minimal test system (runtime validation)
 *
 * ❗ GOALS:
 * - prove runtime works
 * - verify loader + init flow
 * - test logger + trace
 */

import { createLogger } from "@/foundation/logger";
import type { TraceContext } from "@/trace";

// =====================================
// 🚀 INIT
// =====================================

export async function init(ctx: TraceContext): Promise<void> {
  const log = createLogger(ctx);

  log.info("test.system.init");

  // 🔥 możesz dorzucić coś widocznego
  await new Promise((res) => setTimeout(res, 100));

  log.info("test.system.ready");
}