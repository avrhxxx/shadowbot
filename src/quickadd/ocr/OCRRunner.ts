// =====================================
// 📁 src/quickadd/ocr/OCRRunner.ts
// =====================================

import Tesseract from "tesseract.js";
import { createLogger } from "../debug/DebugLogger";

const log = createLogger("OCR");

// =====================================
// 🔹 FULL IMAGE OCR
// =====================================
export async function runFullImage(buffer: Buffer, traceId: string) {
  log.trace("run_full_start", traceId);

  const result = await Tesseract.recognize(buffer, "eng", {
    logger: () => {},
  });

  const text = result.data.text || "";

  // 🔥 RAW — NO CLEANING
  const lines = text.split("\n");

  log.trace("run_full_result", traceId, {
    length: text.length,
    lines: lines.length,
  });

  return { text, lines };
}

// =====================================
// 🔹 LINE BASED OCR (fallback variant)
// =====================================
export async function runLineBased(buffer: Buffer, traceId: string) {
  log.trace("run_line_start", traceId);

  const result = await Tesseract.recognize(buffer, "eng", {
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
// 🔹 BLOCK (NOT USED YET)
// =====================================
export async function runBlockBased(_buffer: Buffer) {
  return { text: "", lines: [] };
}