// =====================================
// 📁 src/runtime/systemState.ts
// =====================================

import { SheetRepository } from "@/integrations/google";
import { log } from "@/core/logger/log";
import {
  createChildContext,
  createAppContext,
} from "@/core/trace/TraceContext";

import type { SystemName } from "./runtimeTypes";

// =====================================
// 🔹 TYPES
// =====================================

type SystemRow = {
  id?: string;
  system: string;
  enabled: string;
  reason?: string;
};

// =====================================
// 🔹 REPO
// =====================================

const repo = new SheetRepository<SystemRow>("system_flags");

// =====================================
// 🔹 CACHE
// =====================================

const CACHE_TTL = 30_000;

let cache: Map<SystemName | "__global__", { enabled: boolean; reason?: string }> =
  new Map();

let lastFetch = 0;

// =====================================
// 🔹 INTERNAL
// =====================================

const appCtx = createAppContext();

async function refreshCache() {
  const ctx = createChildContext(appCtx, {
    system: "runtime",
  });

  const l = log.ctx(ctx);

  try {
    const rows = await repo.findAll({});

    const newCache = new Map<
      SystemName | "__global__",
      { enabled: boolean; reason?: string }
    >();

    for (const row of rows) {
      const enabled = String(row.enabled).toLowerCase() === "true";

      const key =
        row.system === "global"
          ? "__global__"
          : (row.system as SystemName);

      newCache.set(key, {
        enabled,
        reason: row.reason,
      });
    }

    cache = newCache;
    lastFetch = Date.now();

    l.event("system_state.refresh.success", {
      count: newCache.size,
    });
  } catch (err) {
    l.error("system_state.refresh.error", {
      error: err,
    });
  }
}

async function ensureCache() {
  if (Date.now() - lastFetch > CACHE_TTL) {
    await refreshCache();
  }
}

// =====================================
// 🌍 PUBLIC API
// =====================================

export async function isSystemEnabled(
  system: SystemName
): Promise<{ enabled: boolean; reason?: string }> {
  await ensureCache();

  const global = cache.get("__global__");

  if (global && !global.enabled) {
    return {
      enabled: false,
      reason: global.reason ?? "Global disable",
    };
  }

  const entry = cache.get(system);

  if (!entry) {
    return {
      enabled: false,
      reason: "System not configured",
    };
  }

  return entry;
}