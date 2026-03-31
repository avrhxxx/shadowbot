// =====================================
// 📁 src/runtime/runtimeState.ts
// =====================================

import { SheetRepository } from "../integrations/google/index.js";
import { log } from "../core/logger/log.js";
import { createChildContext } from "../core/trace/TraceContext.js";

import type { TraceContext } from "../core/trace/TraceContext.js";
import type { SystemName, RuntimeKey } from "./runtimeTypes.js";

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

let cache: Map<RuntimeKey, { enabled: boolean; reason?: string }> =
  new Map();

let lastFetch = 0;
let refreshPromise: Promise<void> | null = null;

// =====================================
// 🔹 HELPERS
// =====================================

function normalizeError(err: unknown) {
  if (err instanceof Error) {
    return {
      message: err.message,
      stack: err.stack,
    };
  }

  return {
    message: String(err),
  };
}

function parseBoolean(value: string): boolean {
  return value?.toLowerCase() === "true";
}

function mapSystemKey(system: string): RuntimeKey | null {
  if (system === "global") return "__global__";

  const allowed: SystemName[] = [
    "moderator",
    "events",
    "points",
    "translation",
    "absence",
    "quickadd",
    "quickadd_worker",
  ];

  return allowed.includes(system as SystemName)
    ? (system as SystemName)
    : null;
}

// =====================================
// 🔹 INTERNAL
// =====================================

async function refreshCache(ctx: TraceContext) {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const l = log.ctx(ctx);

    try {
      const rows = await repo.findAll({});

      const newCache = new Map<
        RuntimeKey,
        { enabled: boolean; reason?: string }
      >();

      for (const row of rows) {
        if (!row.system) continue;

        const key = mapSystemKey(row.system);
        if (!key) continue;

        newCache.set(key, {
          enabled: parseBoolean(row.enabled),
          reason: row.reason,
        });
      }

      cache = newCache;
      lastFetch = Date.now();

      l.event("runtime_state.refresh.success", {
        count: newCache.size,
      });
    } catch (err) {
      l.error("runtime_state.refresh.error", normalizeError(err));
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function ensureCache(ctx: TraceContext) {
  if (Date.now() - lastFetch > CACHE_TTL) {
    await refreshCache(ctx);
  }
}

// =====================================
// 🌍 PUBLIC API
// =====================================

export async function isSystemEnabled(
  system: SystemName,
  parentCtx: TraceContext
): Promise<{ enabled: boolean; reason?: string }> {
  const ctx = createChildContext(parentCtx, {
    system: "runtime",
  });

  await ensureCache(ctx);

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