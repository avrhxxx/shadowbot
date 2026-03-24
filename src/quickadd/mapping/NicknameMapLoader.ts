// =====================================
// 📁 src/quickadd/mapping/NicknameMapLoader.ts
// =====================================

import { getLearningData } from "../storage/QuickAddService";
import { createLogger } from "../debug/DebugLogger";

const log = createLogger("MAP_LOADER");

// =====================================
// 🔥 LOAD + BUILD MAP (UPGRADED)
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

    const idxOCR = headers.indexOf("ocr_raw");
    const idxLayout = headers.indexOf("layout_text");
    const idxParser = headers.indexOf("parser_output");
    const idxAdjusted = headers.indexOf("adjusted");
    const idxOverride = headers.indexOf("override");

    if (
      idxOCR === -1 ||
      idxLayout === -1 ||
      idxParser === -1 ||
      idxAdjusted === -1 ||
      idxOverride === -1
    ) {
      log.warn("missing_columns");
      return {};
    }

    const map: Record<string, string> = {};

    for (const row of dataRows) {
      const ocr = row[idxOCR];
      const layout = row[idxLayout];
      const parser = row[idxParser];
      const adjusted = row[idxAdjusted];
      const override = row[idxOverride];

      // =====================================
      // 🔥 PRIORITY
      // =====================================
      const final =
        override ||
        adjusted ||
        parser;

      if (!final || typeof final !== "string") continue;

      const cleanedFinal = clean(final);

      if (!cleanedFinal) continue;

      // =====================================
      // 🔥 BUILD MULTI-KEY MAP
      // =====================================
      const sources = [ocr, layout, parser];

      for (const src of sources) {
        if (!src || typeof src !== "string") continue;

        const key = clean(src);

        if (!key) continue;

        map[key] = final;
      }
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
// 🧼 CLEAN
// =====================================
function clean(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "")
    .trim();
}