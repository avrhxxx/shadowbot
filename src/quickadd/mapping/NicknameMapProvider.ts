// =====================================
// 📁 src/quickadd/mapping/NicknameMapProvider.ts
// =====================================

import { getLearningData } from "../storage/QuickAddRepository";
import { log } from "../logger";

export async function loadNicknameMap(
  traceId: string
): Promise<Record<string, string>> {
  try {
    log.emit({ event: "map_load_start", traceId });

    const rows = await getLearningData(traceId);

    log.emit({
      event: "sheet_loaded",
      traceId,
      data: { rows: rows?.length || 0 },
    });

    if (!rows || rows.length < 2) {
      log.emit({
        event: "empty_sheet",
        traceId,
        level: "warn",
        data: { rows: rows?.length || 0 },
      });
      return {};
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    const ocrIndex = headers.indexOf("ocr_raw");
    const parserIndex = headers.indexOf("parser_output");
    const adjustedIndex = headers.indexOf("adjusted");
    const overrideIndex = headers.indexOf("override");

    log.emit({
      event: "columns_detected",
      traceId,
      data: {
        ocrIndex,
        parserIndex,
        adjustedIndex,
        overrideIndex,
      },
    });

    if (ocrIndex === -1) {
      log.emit({
        event: "missing_ocr_column",
        traceId,
        level: "warn",
      });
      return {};
    }

    const map: Record<string, string> = {};

    for (const row of dataRows) {
      const ocrRaw = row[ocrIndex];
      const parser = parserIndex !== -1 ? row[parserIndex] : "";
      const adjusted = adjustedIndex !== -1 ? row[adjustedIndex] : "";
      const override = overrideIndex !== -1 ? row[overrideIndex] : "";

      if (!ocrRaw || typeof ocrRaw !== "string") continue;

      const finalValue =
        (override && override.trim()) ||
        (adjusted && adjusted.trim()) ||
        (parser && parser.trim());

      if (!finalValue) continue;

      const cleaned = clean(ocrRaw);
      if (!cleaned) continue;

      map[cleaned] = finalValue;
    }

    log.emit({
      event: "map_built",
      traceId,
      data: { size: Object.keys(map).length },
    });

    return map;

  } catch (err) {
    log.emit({
      event: "map_load_failed",
      traceId,
      level: "error",
      data: err,
    });

    return {};
  }
}

function clean(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "")
    .trim();
}