// =====================================
// 📁 src/runtime/runtimeLoader.ts
// =====================================

/**
 * 🧠 ROLE:
 * Uruchamia systemy runtime
 *
 * INPUT:
 * - registry
 * - state (czy system aktywny)
 *
 * OUTPUT:
 * - inicjalizowane moduły
 */

import { SYSTEM_REGISTRY } from "./runtimeRegistry.js";
import { isSystemEnabled } from "./runtimeState.js";

import { createRootContext, createChildContext } from "@/core/trace/TraceContext.js";
import { log } from "@/core/logger/log.js";

// =====================================
// 🚀 EXECUTE ONE SYSTEM
// =====================================

async function executeSystem(entry: typeof SYSTEM_REGISTRY[number]) {
  const baseCtx = createRootContext({
    source: "system",
    system: entry.name,
  });

  const l = log.ctx(baseCtx);

  if (!(await isSystemEnabled(entry.name))) {
    l.warn("system.disabled", {
      meta: { system: entry.name },
    });
    return;
  }

  try {
    const module = await entry.loader();

    await module.init(baseCtx);

    l.event("system.started", {
      meta: { system: entry.name },
    });
  } catch (err) {
    l.error("system.error", err, {
      meta: { system: entry.name },
    });
  }
}

// =====================================
// 🚀 LOAD ALL
// =====================================

export async function loadAllSystems() {
  for (const entry of SYSTEM_REGISTRY) {
    await executeSystem(entry);
  }
}