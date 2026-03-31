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
// 🧠 SEED SYSTEM FLAGS
// =====================================

async function seedIfEmpty() {
  const existing = await repo.findAll();

  if (existing.length > 0) return;

  const flow = log.flow("flags.seed");

  flow.start();

  try {
    const systems = SYSTEM_REGISTRY.map((s) => ({
      id: s.name,
      system: s.name,
      enabled: "true",
    }));

    await repo.createMany([
      { id: "global", system: "global", enabled: "true" },
      ...systems,
    ]);

    flow.success({
      stats: { systems: systems.length },
    });
  } catch (err) {
    flow.fail(err);
  }
}

// =====================================
// 🔄 REFRESH
// =====================================

async function refresh() {
  const flow = log.flow("flags.refresh");

  flow.start();

  try {
    await seedIfEmpty();

    const data = await repo.findAll();

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

// =====================================
// ✏️ SET FLAG (🔥 NOWE)
// =====================================

export async function setSystemEnabled(
  system: SystemName,
  enabled: boolean
): Promise<void> {
  const flow = log.flow("flags.set");

  flow.start({
    meta: { system },
    input: { enabled },
  });

  try {
    await repo.updateById(system, {
      enabled: String(enabled),
    });

    // 🔥 ważne: odśwież cache natychmiast
    cache.set(system, enabled);

    flow.success({
      meta: { system },
      result: { enabled },
    });
  } catch (err) {
    flow.fail(err, {
      meta: { system },
    });
  }
}