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
    system: entry.name as never,
  });

  const log = createLogger(ctx);

  const flow = log.flow("lifecycle");

  flow.start({
    meta: { system: entry.name },
  });

  // =============================
  // 🔒 ENABLE CHECK
  // =============================

  const enabled = await isSystemEnabled(entry.name);

  if (!enabled) {
    flow.stepInfo("disabled");
    flow.success(); // 🔥 zamykamy flow
    return;
  }

  flow.stepDebug("enabled");

  // =============================
  // 📦 LOAD MODULE
  // =============================

  let mod: unknown;

  try {
    flow.stepDebug("module.load");

    mod = await entry.loader();

    flow.stepInfo("module.loaded");
  } catch (err) {
    flow.stepError("module.load_fail", err);
    flow.fail(err);
    return;
  }

  // =============================
  // 🔍 NORMALIZE MODULE
  // =============================

  const module: RuntimeModule | undefined =
    (mod as RuntimeModule)?.init
      ? (mod as RuntimeModule)
      : (mod as { default?: RuntimeModule })?.default;

  if (!module?.init) {
    flow.fail(new Error("invalid_module"));
    return;
  }

  // =============================
  // 🚀 INIT
  // =============================

  try {
    flow.stepDebug("init.start");

    await module.init(ctx);

    flow.stepInfo("init.success");
    flow.success();
  } catch (err) {
    flow.stepError("init.fail", err);
    flow.fail(err);
  }
}

// =====================================
// 🚀 LOAD ALL
// =====================================

export async function loadAllSystems() {
  const ctx = createRootContext({
    source: "system",
    system: "runtime",
  });

  const log = createLogger(ctx);

  const flow = log.flow("load");

  flow.start();

  for (const entry of SYSTEM_REGISTRY) {
    await executeSystem(entry);
  }

  flow.success({
    stats: { systems: SYSTEM_REGISTRY.length },
  });
}