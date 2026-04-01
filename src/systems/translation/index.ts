// =====================================
// 📁 src/systems/translation/index.ts
// =====================================

import { client } from "@/index";
import { createLogger } from "@/foundation/logger";
import type { TraceContext } from "@/trace";

// 🔹 LISTENER
import { initTranslationListener } from "./listeners/translation.listener";

// 🔹 ACTIONS
import "./actions/translation.actions";

// =====================================
// 🔹 INIT (dla runtimeLoader)
// =====================================

export async function init(ctx: TraceContext) {
  const log = createLogger(ctx);
  const flow = log.flow("init");

  flow.start();

  try {
    // 🔥 PODPINAMY LISTENER DO CLIENTA
    initTranslationListener(client, ctx);

    flow.success();
  } catch (err) {
    flow.fail(err);
  }
}