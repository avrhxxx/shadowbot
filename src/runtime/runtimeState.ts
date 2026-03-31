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
// 🔹 LOGGER
// =====================================

const ctx = createRootContext({
  source: "system",
  system: "runtime", // 🔥 było runtime_flags → upraszczamy
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
  const flow = log.flow("flags.refresh");

  flow.start();

  try {
    const data = await repo.findAll();

    if (data.length === 0) {
      flow.stepWarn("empty");

      await repo.createMany([
        { id: "global", system: "global", enabled: "true" },
      ]);

      return refresh();
    }

    cache = new Map(
      data.map((d) => [d.system, d.enabled === "true"])
    );

    lastFetch = Date.now();

    flow.success({
      stats: { count: data.length },
    });
  } catch (err) {
    flow.fail(err);
  }
}

// =====================================
// 🔍 ENSURE
// =====================================

async function ensure() {
  const flow = log.flow("flags.ensure");

  const expired = Date.now() - lastFetch > TTL;

  flow.stepDebug("cache_check", {
    decision: {
      condition: "ttl",
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
  const flow = log.flow("flags.check");

  await ensure();

  const global = cache.get("global");
  const local = cache.get(system);

  const result =
    global === false || local === false ? false : true;

  flow.stepInfo("decision", {
    meta: { system },
    decision: {
      condition: "flags",
      result,
    },
  });

  return result;
}