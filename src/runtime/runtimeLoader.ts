// =====================================
// 📁 src/runtime/runtimeLoader.ts
// =====================================

/**
 * 🧠 ROLE:
 * Runtime system executor
 *
 * 📥 INPUT:
 * - SYSTEM_REGISTRY
 * - runtime state (enable/disable)
 *
 * 📤 OUTPUT:
 * - initialized systems
 *
 * ❗ GOALS:
 * - safe execution
 * - full observability (logger)
 * - isolation per system
 */

import { SYSTEM_REGISTRY } from "./runtimeRegistry.js";
import { isSystemEnabled } from "./runtimeState.js";

import { createRootContext } from "@/trace";
import { createLogger } from "@/foundation/logger";

// =====================================
// 🔹 TYPES (runtime safety)
// =====================================

type RuntimeModule = {
  init: (ctx: ReturnType<typeof createRootContext>) => Promise<void> | void;
};

// =====================================
// 🚀 EXECUTE ONE SYSTEM
// =====================================

async function executeSystem(entry: typeof SYSTEM_REGISTRY[number]) {
  const ctx = createRootContext({
    source: "system",
    system: entry.name as any, // 🔥 świadome — dynamic systems
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
  // 📦 LOAD MODULE
  // =============================

  let module: RuntimeModule;

  try {
    log.debug("system.load.start", {
      meta: { system: entry.name },
    });

    module = await entry.loader();

    log.debug("system.load.success", {
      meta: { system: entry.name },
    });
  } catch (err) {
    log.error("system.load.failed", err, {
      meta: { system: entry.name },
    });
    return;
  }

  // =============================
  // 🛑 VALIDATION
  // =============================

  if (!module?.init) {
    log.error("system.invalid_module", {
      meta: { system: entry.name },
    });
    return;
  }

  // =============================
  // 🚀 INIT
  // =============================

  try {
    log.debug("system.init.start", {
      meta: { system: entry.name },
    });

    await module.init(ctx);

    log.info("system.started", {
      meta: { system: entry.name },
    });
  } catch (err) {
    log.error("system.init.failed", err, {
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