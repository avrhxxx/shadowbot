// =====================================
// 📁 src/system/quickadd/mapping/NicknameResolver.ts
// =====================================

import { log } from "../../core/logger/log";
import { loadNicknameMap } from "./NicknameMapProvider";
import { TraceContext } from "../../core/trace/TraceContext";

const localFallbackMap: Record<string, string> = {};

let cachedMap: Record<string, string> | null = null;
let lastLoad = 0;
let loadingPromise: Promise<Record<string, string>> | null = null;

const CACHE_TTL = 60_000;

// =====================================
// 🚀 RESOLVER
// =====================================

export async function resolveNickname(
  nick: string,
  ctx: TraceContext
): Promise<string> {
  const l = log.ctx(ctx);

  if (!nick) return "";

  const cleaned = clean(nick);
  const now = Date.now();

  l.event("resolve_start", {
    input: nick,
    cleaned,
  });

  try {
    const cacheAge = now - lastLoad;
    const cacheExpired = cacheAge > CACHE_TTL;

    // =====================================
    // 🔄 CACHE LOAD (SAFE)
    // =====================================
    if (!cachedMap || cacheExpired) {
      if (!loadingPromise) {
        l.event("cache_refresh_start");

        loadingPromise = loadNicknameMap(ctx)
          .then((map) => {
            cachedMap = map;
            lastLoad = Date.now();

            l.event("cache_loaded", {
              cacheSize: Object.keys(map).length,
            });

            return map;
          })
          .finally(() => {
            loadingPromise = null;
          });
      }

      await loadingPromise;
    } else {
      l.event("cache_hit", {
        ageMs: cacheAge,
      });
    }

    const mapped = cachedMap?.[cleaned];

    if (mapped) {
      l.event("resolved_sheet", {
        input: nick,
        result: mapped,
      });

      return mapped;
    }

  } catch (err) {
    l.warn("map_failed", {
      error: err,
    });
  }

  // =====================================
  // 🧩 FALLBACK
  // =====================================

  const local = localFallbackMap[cleaned];
  if (local) {
    l.event("resolved_local", {
      input: nick,
      result: local,
    });

    return local;
  }

  l.warn("unmapped", {
    input: nick,
  });

  return nick;
}

// =====================================
// 🔧 CLEAN
// =====================================

function clean(input: unknown): string {
  if (typeof input !== "string") return "";

  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "")
    .trim();
}