// =====================================
// 📁 src/quickadd/mapping/NicknameResolver.ts
// =====================================

import { logger } from "../../core/logger/log";
import { loadNicknameMap } from "./NicknameMapProvider";

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
  traceId: string
): Promise<string> {
  if (!nick) return "";

  const cleaned = clean(nick);
  const now = Date.now();

  logger.emit({
    scope: "quickadd.mapping",
    event: "resolve_start",
    traceId,
    context: { input: nick, cleaned },
  });

  try {
    const cacheAge = now - lastLoad;
    const cacheExpired = cacheAge > CACHE_TTL;

    // =====================================
    // 🔄 CACHE LOAD (SAFE)
    // =====================================
    if (!cachedMap || cacheExpired) {
      if (!loadingPromise) {
        logger.emit({
          scope: "quickadd.mapping",
          event: "cache_refresh_start",
          traceId,
        });

        loadingPromise = loadNicknameMap(traceId)
          .then((map) => {
            cachedMap = map;
            lastLoad = Date.now();

            logger.emit({
              scope: "quickadd.mapping",
              event: "cache_loaded",
              traceId,
              context: {
                cacheSize: Object.keys(map).length,
              },
            });

            return map;
          })
          .finally(() => {
            loadingPromise = null;
          });
      }

      await loadingPromise;
    } else {
      logger.emit({
        scope: "quickadd.mapping",
        event: "cache_hit",
        traceId,
        context: {
          ageMs: cacheAge,
        },
      });
    }

    const mapped = cachedMap?.[cleaned];

    if (mapped) {
      logger.emit({
        scope: "quickadd.mapping",
        event: "resolved_sheet",
        traceId,
        context: { input: nick, result: mapped },
      });

      return mapped;
    }

  } catch (err) {
    logger.emit({
      scope: "quickadd.mapping",
      event: "map_failed",
      traceId,
      level: "warn",
      error: err,
    });
  }

  // =====================================
  // 🧩 FALLBACK
  // =====================================

  const local = localFallbackMap[cleaned];
  if (local) {
    logger.emit({
      scope: "quickadd.mapping",
      event: "resolved_local",
      traceId,
      context: { input: nick, result: local },
    });

    return local;
  }

  logger.emit({
    scope: "quickadd.mapping",
    event: "unmapped",
    traceId,
    level: "warn",
    context: { input: nick },
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