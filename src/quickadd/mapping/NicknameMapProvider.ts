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
    log.trace("map_load_start");

    const rows = await getLearningData();

    log.trace("sheet_loaded", {
      rows: rows?.length || 0,
    });

    if (!rows || rows.length < 2) {
      log.warn("empty_sheet", {
        rows: rows?.length || 0,
      });
      return {};
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    // =====================================
    // 🔍 COLUMN DETECTION
    // =====================================

    const ocrIndex = headers.indexOf("ocr_raw");
    const parserIndex = headers.indexOf("parser_output");
    const adjustedIndex = headers.indexOf("adjusted");
    const overrideIndex = headers.indexOf("override");

    log.trace("columns_detected", {
      ocrIndex,
      parserIndex,
      adjustedIndex,
      overrideIndex,
    });

    if (ocrIndex === -1) {
      log.warn("missing_ocr_column");
      return {};
    }

    const map: Record<string, string> = {};

    // =====================================
    // 📊 STATS
    // =====================================

    let processed = 0;
    let skippedNoOCR = 0;
    let skippedNoValue = 0;
    let skippedInvalidKey = 0;

    // =====================================
    // 🔄 BUILD MAP
    // =====================================

    for (const row of dataRows) {
      processed++;

      const ocrRaw = row[ocrIndex];
      const parser = parserIndex !== -1 ? row[parserIndex] : "";
      const adjusted = adjustedIndex !== -1 ? row[adjustedIndex] : "";
      const override = overrideIndex !== -1 ? row[overrideIndex] : "";

      if (!ocrRaw || typeof ocrRaw !== "string") {
        skippedNoOCR++;
        continue;
      }

      // =====================================
      // 🔥 PRIORITY
      // =====================================
      const finalValue =
        (override && override.trim()) ||
        (adjusted && adjusted.trim()) ||
        (parser && parser.trim());

      if (!finalValue) {
        skippedNoValue++;
        continue;
      }

      const cleaned = clean(ocrRaw);
      if (!cleaned) {
        skippedInvalidKey++;
        continue;
      }

      map[cleaned] = finalValue;
    }

    // =====================================
    // 📊 RESULT LOG
    // =====================================

    log.trace("map_stats", {
      processed,
      valid: Object.keys(map).length,
      skippedNoOCR,
      skippedNoValue,
      skippedInvalidKey,
    });

    log.trace("map_built", {
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