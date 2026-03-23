// =====================================
// 📁 src/quickadd/mapping/NicknameResolver.ts
// =====================================

import { createLogger } from "../debug/DebugLogger";

const log = createLogger("RESOLVER");

// 🔥 TEMP CACHE (MVP)
// później podmienimy to na Google Sheets
const nicknameMap: Record<string, string> = {
  // przykłady:
  // "lunax": "LunaxDragon",
  // "lnx": "LunaxDragon",
};

export async function resolveNickname(nick: string): Promise<string> {
  if (!nick) return "";

  const cleaned = cleanNickname(nick);

  // 🔥 exact match
  const mapped = nicknameMap[cleaned];

  if (mapped) {
    log("nickname_resolved", {
      input: nick,
      cleaned,
      result: mapped,
    });

    return mapped;
  }

  // 🔥 fallback
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