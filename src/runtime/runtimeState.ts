// =====================================
// 📁 src/runtime/systemState.ts
// =====================================

import { SheetRepository } from "@/integrations/google";
import { log } from "@/core/logger/log";
import { TraceContext, createChildContext } from "@/core/trace/TraceContext";
import { SystemName, SystemStateEntry } from "./runtimeTypes";

// =============================
// 🔹 TYPES
// =============================

type SystemRow = {
  id?: string;
  system: string;
  enabled: string;
  reason?: string;
};

// =============================
// 🔹 VALID SYSTEMS
// =============================

const VALID_SYSTEMS: SystemName[] = [
  "moderator",
  "events",
  "points",
  "translation",
  "absence",
  "quickadd",
];

function isValidSystemName(value: string): value is SystemName {
  return VALID_SYSTEMS.includes(value as SystemName);
}

// =============================
// 🔹 REPO
// =============================

const repo = new SheetRepository<SystemRow>("system_flags");

// =============================
// 🔹 CACHE
// =============================

const CACHE_TTL = 30_000;

let cache = new Map<SystemName, SystemStateEntry>();
let lastFetch = 0;
let loading: Promise<void> | null = null;

// =============================
// 🔹 INTERNAL
// =============================

async function refreshCache(ctx: TraceContext) {
  const l = log.ctx(ctx);

  try {
    const rows = await repo.findAll({});

    const newCache = new Map<SystemName, SystemStateEntry>();

    for (const row of rows) {
      if (!isValidSystemName(row.system)) {
        l.warn("runtime.state.invalid_system", {
          system: row.system,
        });
        continue;
      }

      const enabled =
        String(row.enabled).toLowerCase() === "true";

      newCache.set(row.system, {
        enabled,
        reason: row.reason,
      });
    }

    cache = newCache;
    lastFetch = Date.now();

    l.event("runtime.state.refresh.success", {
      count: newCache.size,
    });
  } catch (err) {
    l.error("runtime.state.refresh.error", {
      error: err,
    });
  }
}

async function ensureCache(ctx: TraceContext) {
  const now = Date.now();

  if (now - lastFetch <= CACHE_TTL) return;

  if (!loading) {
    loading = refreshCache(ctx).finally(() => {
      loading = null;
    });
  }

  await loading;
}

// =============================
// 🌍 PUBLIC API
// =============================

export async function isSystemEnabled(
  system: SystemName,
  ctx: TraceContext
): Promise<SystemStateEntry> {
  const stateCtx = createChildContext(ctx, {
    system: "runtime",
  });

  await ensureCache(stateCtx);

  const entry = cache.get(system);

  if (!entry) {
    return {
      enabled: false,
      reason: "System not configured",
    };
  }

  return entry;
}