// =====================================
// 📁 src/quickadd/ocr/OCRService.ts
// =====================================

import fetch from "node-fetch";
import { preprocessBase, preprocessForTesseract } from "./OCRPreprocess";
import { runFullImage, runLineBased } from "./OCRRunner";
import { createLogger } from "../debug/DebugLogger";
import { OCRMultiResult } from "./OCRTypes";

const log = createLogger("OCR");

export async function runOCR(imageUrl: string, traceId: string): Promise<OCRMultiResult> {
  log.trace("ocr_start", traceId, imageUrl);

  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    log.trace("image_downloaded", traceId, { size: buffer.length });

    // =====================================
    // 🔹 BASE PREPROCESS
    // =====================================
    const base = await preprocessBase(buffer);

    // =====================================
    // 🔹 ENGINE PREPROCESS
    // =====================================
    const tesseractBuffer = await preprocessForTesseract(base);

    // =====================================
    // 🔹 RUN MULTI OCR
    // =====================================
    const results = await Promise.all([
      runFullImage(tesseractBuffer, traceId),
      runLineBased(tesseractBuffer, traceId),
    ]);

    const sources = [
      {
        source: "TESSERACT_FULL" as const,
        text: results[0].text,
        lines: results[0].lines,
      },
      {
        source: "TESSERACT_LINE" as const,
        text: results[1].text,
        lines: results[1].lines,
      },
    ];

    log.trace("ocr_multi_done", traceId, {
      sources: sources.map((s) => ({
        source: s.source,
        lines: s.lines.length,
        textLength: s.text.length,
      })),
    });

    return { sources };
  } catch (err) {
    log.error("ocr_error", err, traceId);

    return {
      sources: [],
    };
  }
}