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
// 🔹 INTERNAL RUN WITH PSM
// =====================================
async function runWithPSM(
  buffer: Buffer,
  traceId: string,
  psm: number,
  label: string
) {
  log.trace("run_psm_start", traceId, { psm, label });

  const result = await Tesseract.recognize(buffer, "eng", {
    tessedit_pageseg_mode: String(psm),
    logger: () => {},
  });

  const text = result.data.text || "";
  const lines = text.split("\n");
  const words = result.data.words || [];

  const tokens: OCRToken[] = words.map((w: any) => ({
    text: w.text,
    x: w.bbox.x0,
    y: w.bbox.y0,
    width: w.bbox.x1 - w.bbox.x0,
    height: w.bbox.y1 - w.bbox.y0,
    confidence: w.confidence,
  }));

  log.trace("run_psm_result", traceId, {
    label,
    psm,
    textLength: text.length,
    lines: lines.length,
    tokens: tokens.length,
  });

  return {
    text,
    lines,
    tokens,
  };
}

// =====================================
// 🔹 FULL IMAGE OCR (PSM 6)
// =====================================
export async function runFullImage(buffer: Buffer, traceId: string) {
  return runWithPSM(buffer, traceId, 6, "FULL_PSM6");
}

// =====================================
// 🔹 LINE OCR (PSM 11 - SPARSE 🔥)
// =====================================
export async function runLineBased(buffer: Buffer, traceId: string) {
  return runWithPSM(buffer, traceId, 11, "SPARSE_PSM11");
}

// =====================================
// 🔹 BOX OCR (PSM 4 - COLUMNS)
// =====================================
export async function runBoxBased(buffer: Buffer, traceId: string) {
  return runWithPSM(buffer, traceId, 4, "BLOCK_PSM4");
}

// =====================================
// 🔹 HOCR (STRUCTURE)
// =====================================
export async function runHOCR(buffer: Buffer, traceId: string) {
  log.trace("run_hocr_start", traceId);

  const result = await Tesseract.recognize(buffer, "eng", {
    tessedit_create_hocr: "1",
    logger: () => {},
  });

  const hocr = result.data.hocr || "";

  log.trace("run_hocr_result", traceId, {
    length: hocr.length,
  });

  return { hocr };
}