// =====================================
// 📁 src/quickadd/mapping/NicknameResolver.ts
// =====================================

import { log } from "../logger";
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

  log.emit({
    event: "resolve_start",
    traceId,
    data: { input: nick, cleaned },
  });

  try {
    const cacheAge = now - lastLoad;
    const cacheExpired = cacheAge > CACHE_TTL;

    if (!cachedMap || cacheExpired) {
      cachedMap = await loadNicknameMap(traceId);
      lastLoad = Date.now();

      log.emit({
        event: "cache_loaded",
        traceId,
        data: {
          size: Object.keys(cachedMap).length,
        },
      });
    }

    const mapped = cachedMap[cleaned];

    if (mapped) {
      log.emit({
        event: "resolved_sheet",
        traceId,
        data: { input: nick, result: mapped },
      });

      return mapped;
    }

  } catch (err) {
    log.emit({
      event: "map_failed",
      traceId,
      level: "warn",
      data: err,
    });
  }

  const local = localFallbackMap[cleaned];
  if (local) return local;

  log.emit({
    event: "unmapped",
    traceId,
    level: "warn",
    data: { input: nick },
  });

  return nick;
}

function clean(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "")
    .trim();
}