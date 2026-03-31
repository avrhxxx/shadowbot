// =====================================
// 📁 src/runtime/runtimeLoader.ts
// =====================================

import { SYSTEM_REGISTRY } from "./runtimeRegistry.js";
import { isSystemEnabled } from "./runtimeState.js";

import { createRootContext } from "@/trace";
import { createLogger } from "@/foundation/logger";
import { createFlowLogger } from "@/foundation/logger/helpers/flowLogger";

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
  const flow = createFlowLogger(log, `system.${entry.name}.lifecycle`);

  flow.start();

  // =============================
  // 🔒 ENABLE CHECK
  // =============================

  const enabled = await isSystemEnabled(entry.name);

  if (!enabled) {
    flow.stepInfo("disabled", {
      meta: { system: entry.name },
    });
    return;
  }

  // =============================
  // 📦 LOAD MODULE
  // =============================

  let mod: unknown;

  try {
    flow.step("load.start");

    mod = await entry.loader();

    flow.stepInfo("load.success");
  } catch (err) {
    flow.stepError("load.failed", err);
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

  // =============================
  // 🛑 VALIDATION
  // =============================

  if (!module?.init) {
    flow.stepError("invalid_module", undefined, {
      meta: { system: entry.name },
    });
    flow.fail();
    return;
  }

  // =============================
  // 🚀 INIT
  // =============================

  try {
    flow.step("init.start");

    await module.init(ctx);

    flow.stepInfo("init.success");
    flow.success();
  } catch (err) {
    flow.stepError("init.failed", err);
    flow.fail(err);
  }
}

// =====================================
// 🚀 LOAD ALL
// =====================================

export async function loadAllSystems() {
  const ctx = createRootContext({
    source: "system",
    system: "app",
  });

  const log = createLogger(ctx);
  const flow = createFlowLogger(log, "runtime.load_all");

  flow.start();

  for (const entry of SYSTEM_REGISTRY) {
    await executeSystem(entry);
  }

  flow.success();
}