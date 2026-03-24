// =====================================
// 📁 src/quickadd/mapping/NicknameMapProvider.ts
// =====================================

/**
 * 🧠 ROLE:
 * Loads and builds nickname mapping from persistent storage (Google Sheets).
 *
 * This is a DATA PROVIDER (not resolver).
 *
 * Responsible for:
 * - loading learning data
 * - building normalized OCR → correct nickname map
 *
 * ❗ RULES:
 * - NO caching here (resolver handles it)
 * - NO business logic
 * - PURE data transformation
 */

import { getLearningData } from "../storage/QuickAddRepository";
import { createLogger } from "../debug/DebugLogger";

const log = createLogger("MAP_PROVIDER");

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
      const parser = parserIndex !== -1 ? row[parserIndex] : "";
      const adjusted = adjustedIndex !== -1 ? row[adjustedIndex] : "";
      const override = overrideIndex !== -1 ? row[overrideIndex] : "";

      if (!ocrRaw || typeof ocrRaw !== "string") continue;

      // =====================================
      // 🔥 PRIORITY
      // =====================================
      const finalValue =
        (override && override.trim()) ||
        (adjusted && adjusted.trim()) ||
        (parser && parser.trim());

      if (!finalValue) continue;

      const cleaned = clean(ocrRaw);
      if (!cleaned) continue;

      map[cleaned] = finalValue;
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
// 🧼 NORMALIZER (ONLY FOR KEYS)
// =====================================

function clean(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "")
    .trim();
}