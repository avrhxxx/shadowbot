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

const flagsRepo = new GoogleRepository<SystemFlag>(SYSTEM_FLAGS_SHEET);

// =====================================
// 🔹 LOGGER
// =====================================

const ctx = createRootContext({ source: "system", system: "runtime" });
const log = createLogger(ctx);

// =====================================
// 🔹 CACHE
// =====================================

let cache: Map<string, boolean> = new Map();
let lastFetch = 0;
const TTL = 30_000; // cache TTL dla normalnych odczytów
const REFRESH_INTERVAL_MS = 15_000; // worker refresh co 15s

// =====================================
// 🧠 SEED SYSTEM FLAGS
// =====================================

async function seedIfEmpty() {
  const existing = await flagsRepo.findAll();
  if (existing.length > 0) return;

  const flow = log.flow("flags.seed");
  flow.start();

  try {
    const systems = SYSTEM_REGISTRY.map((s) => ({
      id: s.name,
      system: s.name,
      enabled: "true",
    }));

    await flagsRepo.createMany([
      { id: "global", system: "global", enabled: "true" },
      ...systems,
    ]);

    flow.success({ stats: { systems: systems.length } });
  } catch (err) {
    flow.fail(err);
  }
}

// =====================================
// 🔄 REFRESH FLAGS
// =====================================

async function refresh() {
  const flow = log.flow("flags.refresh");
  flow.start();

  try {
    await seedIfEmpty();

    const data = await flagsRepo.findAll();
    cache = new Map(data.map((d) => [d.system, d.enabled === "true"]));
    lastFetch = Date.now();

    flow.success({ stats: { count: data.length } });
  } catch (err) {
    flow.fail(err as Error);
  }
}

// =====================================
// 🔍 ENSURE CACHE
// =====================================

async function ensure() {
  const expired = Date.now() - lastFetch > TTL;
  if (expired) await refresh();
}

// =====================================
// 🔍 CHECK FLAG
// =====================================

export async function isSystemEnabled(system: SystemName): Promise<boolean> {
  await ensure();
  const global = cache.get("global");
  const local = cache.get(system);
  return global === false || local === false ? false : true;
}

// =====================================
// ✏️ SET FLAG
// =====================================

export async function setSystemEnabled(system: SystemName, enabled: boolean): Promise<void> {
  const flow = log.flow("flags.set");
  flow.start({ meta: { system }, input: { enabled } });

  try {
    await flagsRepo.updateById(system, { enabled: String(enabled) });

    // 🔥 odśwież cache od razu
    cache.set(system, enabled);

    flow.success({ meta: { system }, result: { enabled } });
  } catch (err) {
    flow.fail(err as Error, { meta: { system } });
  }
}

// =====================================
// 🔄 WORKER (AUTO REFRESH)
// =====================================

export function startFlagsWorker() {
  log.info({ system: "flags.worker", message: "Starting system flags worker..." });

  // od razu refresh przy starcie
  refresh();

  setInterval(async () => {
    try {
      await refresh();
    } catch (err) {
      log.error({ system: "flags.worker", message: "Failed to refresh system flags", error: err as Error });
    }
  }, REFRESH_INTERVAL_MS);
}