// =====================================
// 📁 src/runtime/runtimeLoader.ts
// =====================================

import { SYSTEM_REGISTRY } from "./runtimeRegistry.js";
import { isSystemEnabled } from "./runtimeState.js";

import { createRootContext } from "@/trace";
import { createLogger } from "@/foundation/logger";

// =====================================
// 🔹 TYPES
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
    system: entry.name as never, // ✅ lepsze niż any (świadome ograniczenie)
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

  let mod: unknown;

  try {
    log.debug("system.load.start", {
      meta: { system: entry.name },
    });

    mod = await entry.loader();

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
  // 🔍 NORMALIZE MODULE
  // =============================

  const module: RuntimeModule | undefined =
    (mod as RuntimeModule)?.init
      ? (mod as RuntimeModule)
      : (mod as { default?: RuntimeModule })?.default;

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