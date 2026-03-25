// =====================================
// 📁 src/quickadd/mapping/NicknameResolver.ts
// =====================================

/**
 * 🧠 ROLE:
 * Resolves nicknames using:
 * - cached sheet mapping
 * - local fallback
 *
 * Responsible for:
 * - caching map
 * - resolving nicknames
 *
 * ❗ RULES:
 * - caching lives here (NOT in provider)
 * - always safe fallback
 */

import { createLogger } from "../debug/DebugLogger";
import { loadNicknameMap } from "./NicknameMapProvider";

const log = createLogger("RESOLVER");

// =====================================
// 🧠 STATE
// =====================================

const localFallbackMap: Record<string, string> = {};

let cachedMap: Record<string, string> | null = null;
let lastLoad = 0;
const CACHE_TTL = 60_000;

// =====================================
// 🔥 MAIN
// =====================================

export async function resolveNickname(nick: string): Promise<string> {
  if (!nick) return "";

  const cleaned = clean(nick);
  const now = Date.now();

  log.trace("resolve_start", {
    input: nick,
    cleaned,
  });

  try {
    const cacheAge = now - lastLoad;
    const cacheExpired = cacheAge > CACHE_TTL;

    // =====================================
    // 🧠 CACHE CHECK
    // =====================================

    if (!cachedMap) {
      log.trace("cache_miss", {
        reason: "empty",
      });
    } else if (cacheExpired) {
      log.trace("cache_expired", {
        ageMs: cacheAge,
        ttl: CACHE_TTL,
      });
    } else {
      log.trace("cache_hit", {
        ageMs: cacheAge,
        size: Object.keys(cachedMap).length,
      });
    }

    // =====================================
    // 🔄 LOAD MAP IF NEEDED
    // =====================================

    if (!cachedMap || cacheExpired) {
      const before = Date.now();

      cachedMap = await loadNicknameMap();
      lastLoad = Date.now();

      log.trace("cache_loaded", {
        size: Object.keys(cachedMap).length,
        loadTimeMs: Date.now() - before,
      });
    }

    // =====================================
    // 🔍 LOOKUP
    // =====================================

    const mapped = cachedMap[cleaned];

    if (mapped) {
      log.trace("resolved_sheet", {
        input: nick,
        cleaned,
        result: mapped,
      });

      log.trace("resolve_done", {
        path: "sheet",
      });

      return mapped;
    }

  } catch (err) {
    log.warn("map_failed", err);
  }

  // =====================================
  // 🔹 LOCAL FALLBACK
  // =====================================

  const local = localFallbackMap[cleaned];
  if (local) {
    log.trace("resolved_local", {
      input: nick,
      cleaned,
      result: local,
    });

    log.trace("resolve_done", {
      path: "local",
    });

    return local;
  }

  // =====================================
  // 🔹 FINAL FALLBACK
  // =====================================

  log.warn("unmapped", {
    input: nick,
    cleaned,
  });

  log.trace("resolve_done", {
    path: "fallback",
  });

  return nick;
}

// =====================================
// 🧼 CLEAN
// =====================================

function clean(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "")
    .trim();
}