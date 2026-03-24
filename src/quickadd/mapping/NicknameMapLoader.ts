// =====================================
// 📁 src/quickadd/mapping/NicknameMapLoader.ts
// =====================================

import { getLearningData } from "../storage/QuickAddService";
import { createLogger } from "../debug/DebugLogger";

const log = createLogger("MAP_LOADER");

// =====================================
// 🔥 LOAD + BUILD MAP (FIXED)
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

    const ocrIndex = headers.indexOf("ocr_raw");
    const parserIndex = headers.indexOf("parser_output");
    const adjustedIndex = headers.indexOf("adjusted");
    const overrideIndex = headers.indexOf("override");

    if (ocrIndex === -1) {
      log.warn("missing_ocr_column");
      return {};
    }

    const map: Record<string, string> = {};

    for (const row of dataRows) {
      const ocrRaw = row[ocrIndex];
      const parser = parserIndex !== -1 ? row[parserIndex] : undefined;
      const adjusted = adjustedIndex !== -1 ? row[adjustedIndex] : undefined;
      const override = overrideIndex !== -1 ? row[overrideIndex] : undefined;

      if (!ocrRaw || typeof ocrRaw !== "string") continue;

      const key = cleanNickname(ocrRaw);
      if (!key) continue;

      // 🔥 PRIORITY CHAIN
      const finalValue =
        (override && override.trim()) ||
        (adjusted && adjusted.trim()) ||
        (parser && parser.trim());

      if (!finalValue) continue;

      map[key] = finalValue;
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