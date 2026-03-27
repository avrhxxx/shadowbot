// =====================================
// 📁 src/quickadd/mapping/NicknameResolver.ts
// =====================================

import { createScopedLogger } from "@/quickadd/debug/logger";
import { loadNicknameMap } from "./NicknameMapProvider";

const log = createScopedLogger(import.meta.url);

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

export async function resolveNickname(
  nick: string,
  traceId: string
): Promise<string> {
  if (!nick) return "";

  const cleaned = clean(nick);
  const now = Date.now();

  log.trace("resolve_start", traceId, {
    input: nick,
    cleaned,
  });

  try {
    const cacheAge = now - lastLoad;
    const cacheExpired = cacheAge > CACHE_TTL;

    if (!cachedMap) {
      log.trace("cache_miss", traceId, {
        reason: "empty",
      });
    } else if (cacheExpired) {
      log.trace("cache_expired", traceId, {
        ageMs: cacheAge,
        ttl: CACHE_TTL,
      });
    } else {
      log.trace("cache_hit", traceId, {
        ageMs: cacheAge,
        size: Object.keys(cachedMap).length,
      });
    }

    if (!cachedMap || cacheExpired) {
      const before = Date.now();

      cachedMap = await loadNicknameMap(traceId);
      lastLoad = Date.now();

      log.trace("cache_loaded", traceId, {
        size: Object.keys(cachedMap).length,
        loadTimeMs: Date.now() - before,
      });
    }

    const mapped = cachedMap[cleaned];

    if (mapped) {
      log.trace("resolved_sheet", traceId, {
        input: nick,
        cleaned,
        result: mapped,
      });

      log.trace("resolve_done", traceId, {
        path: "sheet",
      });

      return mapped;
    }

  } catch (err) {
    log.warn("map_failed", traceId, {
      error: err,
    });
  }

  const local = localFallbackMap[cleaned];
  if (local) {
    log.trace("resolved_local", traceId, {
      input: nick,
      cleaned,
      result: local,
    });

    log.trace("resolve_done", traceId, {
      path: "local",
    });

    return local;
  }

  log.warn("unmapped", traceId, {
    input: nick,
    cleaned,
  });

  log.trace("resolve_done", traceId, {
    path: "fallback",
  });

  return nick;
}

function clean(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "")
    .trim();
}