// =====================================
// 📁 src/quickadd/mapping/NicknameResolver.ts
// =====================================

import { logger } from "../core/logger/log";
import { loadNicknameMap } from "./NicknameMapProvider";

const localFallbackMap: Record<string, string> = {};

let cachedMap: Record<string, string> | null = null;
let lastLoad = 0;
const CACHE_TTL = 60_000;

export async function resolveNickname(
  nick: string,
  traceId: string
): Promise<string> {
  if (!nick) return "";

  const cleaned = clean(nick);
  const now = Date.now();

  logger.emit({
    event: "resolve_start",
    traceId,
    context: { input: nick, cleaned },
  });

  try {
    const cacheAge = now - lastLoad;
    const cacheExpired = cacheAge > CACHE_TTL;

    if (!cachedMap || cacheExpired) {
      cachedMap = await loadNicknameMap(traceId);
      lastLoad = Date.now();

      logger.emit({
        event: "cache_loaded",
        traceId,
        context: {
          cacheSize: Object.keys(cachedMap).length,
        },
      });
    }

    const mapped = cachedMap[cleaned];

    if (mapped) {
      logger.emit({
        event: "resolved_sheet",
        traceId,
        context: { input: nick, result: mapped },
      });

      return mapped;
    }

  } catch (err) {
    logger.emit({
      event: "map_failed",
      traceId,
      level: "warn",
      error: err,
    });
  }

  const local = localFallbackMap[cleaned];
  if (local) return local;

  logger.emit({
    event: "unmapped",
    traceId,
    level: "warn",
    context: { input: nick },
  });

  return nick;
}

function clean(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "")
    .trim();
}