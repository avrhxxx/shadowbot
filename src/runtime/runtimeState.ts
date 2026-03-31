// =====================================
// 📁 src/runtime/runtimeState.ts
// =====================================

import { GoogleRepository } from "@/integrations/google/googleRepository.js";
import { SYSTEM_FLAGS_SHEET } from "@/integrations/google/googleSchema.js";

import { createRootContext } from "@/trace";
import { createLogger } from "@/foundation/logger";

import { SYSTEM_REGISTRY } from "./runtimeRegistry.js";

import type { SystemName } from "./runtimeTypes";

// =====================================
// 🔹 TYPES
// =====================================

type SystemFlag = {
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
  system: "runtime",
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

    const requiredSystems = [
      "global",
      ...SYSTEM_REGISTRY.map((s) => s.name),
    ];

    const existing = new Set(data.map((d) => d.system));

    const missing = requiredSystems.filter(
      (s) => !existing.has(s)
    );

    if (missing.length > 0) {
      flow.stepWarn("missing.systems", {
        meta: { missing },
      });

      await repo.createMany(
        missing.map((system) => ({
          system,
          enabled: "true",
        }))
      );
    }

    const finalData =
      missing.length > 0 ? await repo.findAll() : data;

    cache = new Map(
      finalData.map((d) => [d.system, d.enabled === "true"])
    );

    lastFetch = Date.now();

    flow.success({
      stats: { count: finalData.length },
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