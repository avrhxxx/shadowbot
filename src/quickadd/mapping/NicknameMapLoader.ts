// =====================================
// 📁 src/quickadd/mapping/NicknameMapLoader.ts
// =====================================

import { getLearningData } from "../storage/QuickAddService"; // ✅ FIX
import { createLogger } from "../debug/DebugLogger";

const log = createLogger("MAP_LOADER");

const QUICKADD_TAB = "quickadd";

// =====================================
// 🔥 LOAD + BUILD MAP
// =====================================
export async function loadNicknameMap(): Promise<Record<string, string>> {
  try {
    const rows = await getLearningData();

    if (!rows || rows.length < 2) {
      log.warn("empty_sheet");
      return {};
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    const adjustedIndex = headers.indexOf("adjusted");

    if (adjustedIndex === -1) {
      log.warn("missing_adjusted_column");
      return {};
    }

    const map: Record<string, string> = {};

    for (const row of dataRows) {
      const adjusted = row[adjustedIndex];

      if (!adjusted || typeof adjusted !== "string") continue;

      const cleaned = cleanNickname(adjusted);

      if (!cleaned) continue;

      map[cleaned] = adjusted;
    }

    log("map_built", {
      size: Object.keys(map).length,
    });

    return map;

  } catch (err) {
    log.error("map_load_failed", err);
    return {};
  }
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