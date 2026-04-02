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
  id?: string;
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
// 🧠 SEED MISSING SYSTEM FLAGS
// =====================================

async function seedMissing() {
  const existing = await repo.findAll();
  const existingNames = new Set(existing.map((s) => s.system));

  const missing = SYSTEM_REGISTRY.filter((s) => !existingNames.has(s.name));

  if (missing.length === 0) return;

  const flow = log.flow("flags.seed_missing");
  flow.start({ meta: { missing: missing.map((s) => s.name) } });

  try {
    const toCreate = missing.map((s) => ({
      id: s.name,
      system: s.name,
      enabled: "true",
    }));

    await repo.createMany(toCreate);

    flow.success({ stats: { created: toCreate.length } });
  } catch (err) {
    flow.fail(err);
  }
}

// =====================================
// 🔄 REFRESH CACHE
// =====================================

async function refresh() {
  const flow = log.flow("flags.refresh");
  flow.start();

  try {
    await seedMissing();

    const data = await repo.findAll();

    cache = new Map(data.map((d) => [d.system, d.enabled === "true"]));
    lastFetch = Date.now();

    // 🔹 DEBUG: pokaż wszystkie systemy i ich aktualny stan
    const stateLog = Array.from(cache.entries())
      .map(([sys, enabled]) => `${sys}: ${enabled ? "ON" : "OFF"}`)
      .join(", ");

    flow.stepInfo("cache_state", { state: stateLog });

    flow.success({ stats: { count: data.length } });
  } catch (err) {
    flow.fail(err);
  }
}

// =====================================
// 🔍 ENSURE CACHE
// =====================================

async function ensure() {
  const expired = Date.now() - lastFetch > TTL;

  if (expired) {
    await refresh();
  }
}

// =====================================
// 🔍 CHECK FLAG
// =====================================

export async function isSystemEnabled(system: SystemName): Promise<boolean> {
  await ensure();

  const global = cache.get("global");
  const local = cache.get(system);

  return global !== false && local !== false;
}

// =====================================
// ✏️ SET FLAG
// =====================================

export async function setSystemEnabled(
  system: SystemName,
  enabled: boolean
): Promise<void> {
  const flow = log.flow("flags.set");
  flow.start({ meta: { system }, input: { enabled } });

  try {
    await repo.updateById(system, { enabled: String(enabled) });

    // odśwież cache natychmiast
    cache.set(system, enabled);

    flow.success({ meta: { system }, result: { enabled } });
  } catch (err) {
    flow.fail(err, { meta: { system } });
  }
}

// =====================================
// 🕹 WORKER
// =====================================

function startFlagsWorker(intervalMs = 60_000) { // <- wydłużony interwał do 1 min
  const flow = log.flow("flags.worker");
  flow.stepInfo("start");

  setInterval(async () => {
    const step = "refresh";
    try {
      await refresh();
      flow.stepInfo(step, { stats: { cacheSize: cache.size } });
    } catch (err) {
      flow.stepError(step, err);
    }
  }, intervalMs);
}

// uruchamiamy worker od razu
startFlagsWorker();