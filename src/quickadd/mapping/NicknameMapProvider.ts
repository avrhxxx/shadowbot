// =====================================
// 📁 src/quickadd/mapping/NicknameMapProvider.ts
// =====================================

import { getLearningData } from "../storage/QuickAddRepository";
import { createScopedLogger } from "@/quickadd/debug/logger";

const log = createScopedLogger(import.meta.url);

// =====================================
// 🔥 LOAD + BUILD MAP
// =====================================

export async function loadNicknameMap(
  traceId: string
): Promise<Record<string, string>> {
  try {
    log.trace("map_load_start", traceId);

    const rows = await getLearningData(traceId);

    log.trace("sheet_loaded", traceId, {
      rows: rows?.length || 0,
    });

    if (!rows || rows.length < 2) {
      log.warn("empty_sheet", traceId, {
        rows: rows?.length || 0,
      });
      return {};
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    const ocrIndex = headers.indexOf("ocr_raw");
    const parserIndex = headers.indexOf("parser_output");
    const adjustedIndex = headers.indexOf("adjusted");
    const overrideIndex = headers.indexOf("override");

    log.trace("columns_detected", traceId, {
      ocrIndex,
      parserIndex,
      adjustedIndex,
      overrideIndex,
    });

    if (ocrIndex === -1) {
      log.warn("missing_ocr_column", traceId);
      return {};
    }

    const map: Record<string, string> = {};

    let processed = 0;
    let skippedNoOCR = 0;
    let skippedNoValue = 0;
    let skippedInvalidKey = 0;

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

    log.trace("map_stats", traceId, {
      processed,
      valid: Object.keys(map).length,
      skippedNoOCR,
      skippedNoValue,
      skippedInvalidKey,
    });

    log.trace("map_built", traceId, {
      size: Object.keys(map).length,
    });

    return map;

  } catch (err) {
    log.error("map_load_failed", err, traceId);
    return {};
  }
}

function clean(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "")
    .trim();
}