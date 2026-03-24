// =====================================
// 📁 src/quickadd/mapping/NicknameResolver.ts
// =====================================

import { createLogger } from "../debug/DebugLogger";
import { loadNicknameMap } from "./NicknameMapLoader";

const log = createLogger("RESOLVER");

const localFallbackMap: Record<string, string> = {};

let cachedMap: Record<string, string> | null = null;
let lastLoad = 0;
const CACHE_TTL = 60_000;

export async function resolveNickname(nick: string): Promise<string> {
  if (!nick) return "";

  const cleaned = cleanNickname(nick);

  try {
    if (!cachedMap || Date.now() - lastLoad > CACHE_TTL) {
      cachedMap = await loadNicknameMap();
      lastLoad = Date.now();

      log("nickname_map_loaded", {
        size: Object.keys(cachedMap).length,
      });
    }

    const sheetMap = cachedMap;

    // =====================================
    // 🔥 1. GOOGLE SHEETS
    // =====================================
    const mappedFromSheet = sheetMap[cleaned];
    if (mappedFromSheet) {
      log("nickname_resolved_sheet", {
        input: nick,
        cleaned,
        result: mappedFromSheet,
      });

      return mappedFromSheet;
    }

  } catch (err) {
    log.warn("nickname_map_failed_using_fallback", err);
  }

  // =====================================
  // 🔥 2. LOCAL FALLBACK
  // =====================================
  const mappedLocal = localFallbackMap[cleaned];
  if (mappedLocal) {
    log("nickname_resolved_local", {
      input: nick,
      cleaned,
      result: mappedLocal,
    });

    return mappedLocal;
  }

  // =====================================
  // 🔥 3. FINAL FALLBACK
  // =====================================
  log.warn("nickname_unmapped", {
    input: nick,
    cleaned,
  });

  // 👉 zamiast cleaned, lepiej zwrócić oryginał
  return nick;
}

// =====================================
// 🧼 CLEANER
// =====================================
function cleanNickname(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "")
    .trim();
}