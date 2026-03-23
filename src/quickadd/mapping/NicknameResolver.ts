// =====================================
// 📁 src/quickadd/mapping/NicknameResolver.ts
// =====================================

import { createLogger } from "../debug/DebugLogger";
import { loadNicknameMap } from "./NicknameMapLoader"; // 🔥 NEW

const log = createLogger("RESOLVER");

// 🔥 LOCAL FALLBACK (awaryjny)
const localFallbackMap: Record<string, string> = {
  // przykłady:
  // "lunax": "LunaxDragon",
  // "lnx": "LunaxDragon",
};

export async function resolveNickname(nick: string): Promise<string> {
  if (!nick) return "";

  const cleaned = cleanNickname(nick);

  try {
    // =====================================
    // 🔥 LOAD MAP (cache + sheet)
    // =====================================
    const sheetMap = await loadNicknameMap();

    // 🔥 1. GOOGLE SHEETS (priority)
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

  return cleaned;
}

// =====================================
// 🧼 CLEANER
// =====================================
function cleanNickname(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "") // usuwa śmieci z OCR
    .trim();
}