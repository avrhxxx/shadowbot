// =====================================
// 📁 src/runtime/systemState.ts
// =====================================

/**
 * 🧠 ROLE:
 * Runtime system toggle state (Google Sheets + cache)
 *
 * Responsibilities:
 * - fetch system flags from Sheets
 * - cache results (TTL)
 * - provide safe access API
 *
 * ❗ RULES:
 * - NO business logic
 * - FAIL SAFE → system disabled by default
 * - MUST be fast (cache first)
 */

import { SheetRepository } from "@/integrations/google";
import { log } from "@/core/logger/log";
import { createChildContext } from "@/core/trace/TraceContext";

// =====================================
// 🔹 TYPES
// =====================================

type SystemRow = {
  id?: string;
  system: string;
  enabled: string; // "true" | "false"
  reason?: string;
};

// =====================================
// 🔹 REPO
// =====================================

const repo = new SheetRepository<SystemRow>("system_flags");

// =====================================
// 🔹 CACHE
// =====================================

const CACHE_TTL = 30_000; // 30s

let cache: Map<string, { enabled: boolean; reason?: string }> =
  new Map();

let lastFetch = 0;

// =====================================
// 🔹 INTERNAL
// =====================================

async function refreshCache(ctx: ReturnType<typeof createChildContext>) {
  const l = log.ctx(ctx);

  try {
    const rows = await repo.findAll({});

    const newCache = new Map<string, { enabled: boolean; reason?: string }>();

    for (const row of rows) {
      const enabled =
        String(row.enabled).toLowerCase() === "true";

      newCache.set(row.system, {
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

async function ensureCache(ctx: ReturnType<typeof createChildContext>) {
  const now = Date.now();

  if (now - lastFetch > CACHE_TTL) {
    await refreshCache(ctx);
  }
}

// =====================================
// 🌍 PUBLIC API
// =====================================

export async function isSystemEnabled(
  system: string
): Promise<{ enabled: boolean; reason?: string }> {
  const ctx = createChildContext({
    system: "runtime",
  });

  await ensureCache(ctx);

  const entry = cache.get(system);

  // FAIL SAFE → disabled if not found
  if (!entry) {
    return {
      enabled: false,
      reason: "System not configured",
    };
  }

  return entry;
}