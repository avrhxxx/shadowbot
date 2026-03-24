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

  try {
    if (!cachedMap || Date.now() - lastLoad > CACHE_TTL) {
      cachedMap = await loadNicknameMap();
      lastLoad = Date.now();

      log("map_loaded", {
        size: Object.keys(cachedMap).length,
      });
    }

    const mapped = cachedMap[cleaned];

    if (mapped) {
      log("resolved_sheet", {
        input: nick,
        cleaned,
        result: mapped,
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
    log("resolved_local", {
      input: nick,
      result: local,
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