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
// 🔹 FULL IMAGE OCR
// =====================================
export async function runFullImage(buffer: Buffer, traceId: string) {
  log.trace("run_full_start", traceId);

  const result = await Tesseract.recognize(buffer, "eng", {
    logger: () => {},
  });

  const text = result.data.text || "";
  const lines = text.split("\n");

  log.trace("run_full_result", traceId, {
    length: text.length,
    lines: lines.length,
  });

  return { text, lines };
}

// =====================================
// 🔹 LINE BASED OCR (fallback)
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
// 🔥 BOX BASED OCR (NEW - LAYOUT)
// =====================================
export async function runBoxBased(buffer: Buffer, traceId: string) {
  log.trace("run_box_start", traceId);

  const result = await Tesseract.recognize(buffer, "eng", {
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

  // 🔥 DEBUG: podstawowe statystyki
  log.trace("run_box_result", traceId, {
    tokens: tokens.length,
  });

  // 🔥 DEBUG: sample (żeby nie spamować)
  log.trace("run_box_sample", traceId, {
    sample: tokens.slice(0, 5),
  });

  return {
    tokens,
  };
}