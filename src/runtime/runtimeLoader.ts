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

import { createRootContext } from "@/trace";
import { createLogger } from "@/foundation/logger";

// =====================================
// 🚀 EXECUTE ONE SYSTEM
// =====================================

async function executeSystem(entry: typeof SYSTEM_REGISTRY[number]) {
  const ctx = createRootContext({
    source: "system",
    system: entry.name,
  });

  const log = createLogger(ctx);

  // =============================
  // 🔒 ENABLE CHECK
  // =============================

  if (!(await isSystemEnabled(entry.name))) {
    log.warn("system.disabled", {
      meta: { system: entry.name },
    });
    return;
  }

  // =============================
  // 🚀 LOAD + INIT
  // =============================

  try {
    const module = await entry.loader();

    await module.init(ctx);

    log.info("system.started", {
      meta: { system: entry.name },
    });
  } catch (err) {
    log.error("system.error", err, {
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