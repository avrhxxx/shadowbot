// =====================================
// 📁 src/quickadd/mapping/NicknameMapProvider.ts
// =====================================

import { getLearningData } from "../storage/QuickAddRepository";
import { log } from "../../core/logger/log";
import { TraceContext } from "../../core/trace/TraceContext";

export async function loadNicknameMap(
  ctx: TraceContext
): Promise<Record<string, string>> {
  const l = log.ctx(ctx);

  try {
    l.event("map_load_start");

    const rows = await getLearningData(ctx);

    l.event("sheet_loaded", {
      context: { rowsCount: rows?.length || 0 },
    });

    if (!rows || rows.length < 2) {
      l.warn("empty_sheet", {
        context: { rowsCount: rows?.length || 0 },
      });
      return {};
    }

    const headersRaw = rows[0];

    if (!Array.isArray(headersRaw)) {
      l.warn("invalid_headers");
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

    l.event("columns_detected", {
      context: {
        ocrIndex,
        parserIndex,
        adjustedIndex,
        overrideIndex,
      },
    });

    if (ocrIndex === -1) {
      l.warn("missing_ocr_column");
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

    l.event("map_built", {
      context: { mapSize: Object.keys(map).length },
    });

    return map;

  } catch (err) {
    l.error("map_load_failed", {
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