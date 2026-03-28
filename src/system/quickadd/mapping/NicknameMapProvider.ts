// =====================================
// 📁 src/quickadd/mapping/NicknameMapProvider.ts
// =====================================

import { getLearningData } from "../storage/QuickAddRepository";
import { logger } from "../../core/logger/log";

export async function loadNicknameMap(
  traceId: string
): Promise<Record<string, string>> {
  try {
    logger.emit({
      scope: "quickadd.mapping",
      event: "map_load_start",
      traceId,
    });

    const rows = await getLearningData(traceId);

    logger.emit({
      scope: "quickadd.mapping",
      event: "sheet_loaded",
      traceId,
      context: { rowsCount: rows?.length || 0 },
    });

    if (!rows || rows.length < 2) {
      logger.emit({
        scope: "quickadd.mapping",
        event: "empty_sheet",
        traceId,
        level: "warn",
        context: { rowsCount: rows?.length || 0 },
      });
      return {};
    }

    const headersRaw = rows[0];

    if (!Array.isArray(headersRaw)) {
      logger.emit({
        scope: "quickadd.mapping",
        event: "invalid_headers",
        traceId,
        level: "warn",
      });
      return {};
    }

    const headers = headersRaw.map((h) =>
      typeof h === "string" ? h : String(h)
    );

    const dataRows = rows.slice(1);

    const ocrIndex = headers.indexOf("ocr_raw");
    const parserIndex = headers.indexOf("parser_output");
    const adjustedIndex = headers.indexOf("adjusted");
    const overrideIndex = headers.indexOf("override");

    logger.emit({
      scope: "quickadd.mapping",
      event: "columns_detected",
      traceId,
      context: {
        ocrIndex,
        parserIndex,
        adjustedIndex,
        overrideIndex,
      },
    });

    if (ocrIndex === -1) {
      logger.emit({
        scope: "quickadd.mapping",
        event: "missing_ocr_column",
        traceId,
        level: "warn",
      });
      return {};
    }

    const map: Record<string, string> = {};

    for (const row of dataRows) {
      if (!Array.isArray(row)) continue;

      const ocrRaw = row[ocrIndex];
      const parser = parserIndex !== -1 ? row[parserIndex] : "";
      const adjusted = adjustedIndex !== -1 ? row[adjustedIndex] : "";
      const override = overrideIndex !== -1 ? row[overrideIndex] : "";

      if (!ocrRaw || typeof ocrRaw !== "string") continue;

      const finalValue =
        (typeof override === "string" && override.trim()) ||
        (typeof adjusted === "string" && adjusted.trim()) ||
        (typeof parser === "string" && parser.trim());

      if (!finalValue) continue;

      const cleaned = clean(ocrRaw);
      if (!cleaned) continue;

      map[cleaned] = finalValue;
    }

    logger.emit({
      scope: "quickadd.mapping",
      event: "map_built",
      traceId,
      context: { mapSize: Object.keys(map).length },
    });

    return map;

  } catch (err) {
    logger.emit({
      scope: "quickadd.mapping",
      event: "map_load_failed",
      traceId,
      level: "error",
      error: err,
    });

    return {};
  }
}

function clean(input: unknown): string {
  if (typeof input !== "string") return "";

  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, "")
    .trim();
}