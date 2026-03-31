// =====================================
// 📁 src/runtime/runtimeState.ts
// =====================================

import { GoogleRepository } from "@/integrations/google/googleRepository.js";
import { SYSTEM_FLAGS_SHEET } from "@/integrations/google/googleSchema.js";

import { createRootContext } from "@/trace";
import { createLogger } from "@/foundation/logger";

import type { SystemName } from "./runtimeTypes";

// =====================================
// 🔹 TYPES
// =====================================

type SystemFlag = {
  id: string;
  system: string;
  enabled: string;
  reason?: string;
};

// =====================================
// 🔹 REPO
// =====================================

const repo = new GoogleRepository<SystemFlag>(SYSTEM_FLAGS_SHEET);

// =====================================
// 🔹 LOGGER (GLOBAL)
// =====================================

const ctx = createRootContext({
  source: "system",
  system: "runtime" as never,
});

const log = createLogger(ctx);

// =====================================
// 🔹 CACHE
// =====================================

let cache: Map<string, boolean> = new Map();
let lastFetch = 0;

const TTL = 30_000;

// =====================================
// 🔄 REFRESH
// =====================================

async function refresh() {
  const flow = log.system("runtime").flow("flags");

  flow.stepInfo("refresh.start");

  try {
    const data = await repo.findAll();

    // 🔥 AUTO-SEED
    if (data.length === 0) {
      flow.stepWarn("refresh.empty_sheet");

      const defaults: SystemFlag[] = [
        {
          id: "global",
          system: "global",
          enabled: "true",
        },
      ];

      await repo.createMany(defaults);

      flow.stepInfo("refresh.seeded", {
        stats: { count: defaults.length },
      });

      return await refresh();
    }

    cache = new Map(
      data.map((d) => [d.system, d.enabled === "true"])
    );

    lastFetch = Date.now();

    flow.stepInfo("refresh.success", {
      stats: { count: data.length },
    });
  } catch (err) {
    flow.stepError("refresh.failed", err);
  }
}

// =====================================
// 🔍 ENSURE CACHE
// =====================================

async function ensure() {
  const flow = log.system("runtime").flow("flags");

  const expired = Date.now() - lastFetch > TTL;

  flow.stepDebug("cache.check", {
    decision: {
      condition: "ttl_expired",
      result: expired,
    },
  });

  if (expired) {
    await refresh();
  }
}

// =====================================
// 🔍 CHECK
// =====================================

export async function isSystemEnabled(
  system: SystemName
): Promise<boolean> {
  const flow = log.system("runtime").flow("flags");

  await ensure();

  const global = cache.get("global");
  const local = cache.get(system);

  const result =
    global === false || local === false ? false : true;

  flow.stepInfo("check.result", {
    meta: { system },
    decision: {
      condition: "global/local flags",
      result,
    },
  });

  return result;
}