// =====================================
// 📁 src/quickadd/ocr/OCRRunner.ts
// =====================================

import Tesseract from "tesseract.js";
import { createLogger } from "../debug/DebugLogger";

const log = createLogger("OCR");

// =====================================
// 🧱 TYPES
// =====================================
export type OCRToken = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
};

// =====================================
// 🔹 INTERNAL HELPER (PSM RUN)
// =====================================
async function runWithPSM(
  buffer: Buffer,
  traceId: string,
  psm: number,
  label: string
) {
  log.trace("run_psm_start", traceId, { psm, label });

  const result = await Tesseract.recognize(buffer, "eng", {
    tessedit_pageseg_mode: psm,
    logger: () => {},
  });

  const text = result.data.text || "";
  const lines = text.split("\n");

  log.trace("run_psm_result", traceId, {
    label,
    psm,
    length: text.length,
    lines: lines.length,
  });

  return { text, lines };
}

// =====================================
// 🔹 FULL IMAGE OCR (MULTI PSM)
// =====================================
export async function runFullImage(buffer: Buffer, traceId: string) {
  const runs = await Promise.all([
    runWithPSM(buffer, traceId, Tesseract.PSM.SPARSE_TEXT, "SPARSE"),
    runWithPSM(buffer, traceId, Tesseract.PSM.AUTO, "AUTO"),
    runWithPSM(buffer, traceId, Tesseract.PSM.SINGLE_BLOCK, "BLOCK"),
  ]);

  const mergedText = runs.map((r) => r.text).join("\n");
  const mergedLines = mergedText.split("\n");

  log.trace("run_full_merged", traceId, {
    totalLines: mergedLines.length,
  });

  return {
    text: mergedText,
    lines: mergedLines,
  };
}

// =====================================
// 🔹 LINE BASED OCR (fallback)
// =====================================
export async function runLineBased(buffer: Buffer, traceId: string) {
  log.trace("run_line_start", traceId);

  const result = await Tesseract.recognize(buffer, "eng", {
    tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE,
    logger: () => {},
  });

  const text = result.data.text || "";
  const lines = text.split("\n");

  log.trace("run_line_result", traceId, {
    length: text.length,
    lines: lines.length,
  });

  return { text, lines };
}

// =====================================
// 🔥 BOX BASED OCR (TOKENS)
// =====================================
export async function runBoxBased(buffer: Buffer, traceId: string) {
  log.trace("run_box_start", traceId);

  const result = await Tesseract.recognize(buffer, "eng", {
    tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
    logger: () => {},
  });

  const words = result.data.words || [];

  const tokens: OCRToken[] = words.map((w: any) => ({
    text: w.text,
    x: w.bbox.x0,
    y: w.bbox.y0,
    width: w.bbox.x1 - w.bbox.x0,
    height: w.bbox.y1 - w.bbox.y0,
    confidence: w.confidence,
  }));

  log.trace("run_box_result", traceId, {
    tokens: tokens.length,
  });

  log.trace("run_box_sample", traceId, {
    sample: tokens.slice(0, 10),
  });

  return {
    tokens,
  };
}

// =====================================
// 🔥 HOCR (STRUCTURE)
// =====================================
export async function runHOCR(buffer: Buffer, traceId: string) {
  log.trace("run_hocr_start", traceId);

  const result = await Tesseract.recognize(buffer, "eng", {
    tessjs_create_hocr: "1",
    tessedit_pageseg_mode: Tesseract.PSM.AUTO,
    logger: () => {},
  });

  const hocr = result.data.hocr || "";

  log.trace("run_hocr_result", traceId, {
    length: hocr.length,
  });

  return { hocr };
}