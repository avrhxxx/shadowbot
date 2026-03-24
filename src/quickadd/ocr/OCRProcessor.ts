// =====================================
// 📁 src/quickadd/ocr/OCRProcessor.ts
// =====================================

/**
 * 🔥 ROLE:
 * OCR orchestrator (entry point for pipeline).
 *
 * Responsible for:
 * - downloading image
 * - preprocessing (optional)
 * - running multiple OCR modes
 * - aggregating results
 */

import fetch from "node-fetch";
import { createLogger } from "../debug/DebugLogger";
import { OCREngine } from "./OCREngine";
import { OCRResult } from "./OCRTypes";

const log = createLogger("OCR_PROCESSOR");

// 🔥 FEATURE FLAGS
const USE_PREPROCESS = false;
const ENABLE_HOCR = true;

export async function runOCR(
  imageUrl: string,
  traceId: string
): Promise<OCRResult> {
  log.trace("ocr_start", traceId, imageUrl);

  try {
    const res = await fetch(imageUrl);

    if (!res.ok) {
      throw new Error(`fetch_failed: ${res.status}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());

    log.trace("image_loaded", traceId, {
      size: buffer.length,
    });

    let inputBuffer = buffer;

    // =====================================
    // 🔹 PREPROCESS (optional)
    // =====================================
    if (USE_PREPROCESS) {
      const { OCRPreprocessor } = await import("./OCRPreprocessor");

      const base = await OCRPreprocessor.base(buffer);
      inputBuffer = await OCRPreprocessor.enhance(base);

      log.trace("preprocess_applied", traceId);
    }

    // =====================================
    // 🔹 RUN OCR
    // =====================================
    const tasks = [
      OCREngine.full(inputBuffer, traceId),
      OCREngine.line(inputBuffer, traceId),
      OCREngine.box(inputBuffer, traceId),
    ];

    if (ENABLE_HOCR) {
      tasks.push(OCREngine.hocr(inputBuffer, traceId) as any);
    }

    const [full, line, box, hocr] = await Promise.all(tasks);

    // =====================================
    // 🔹 BUILD SOURCES
    // =====================================
    const sources = [
      {
        source: "TESSERACT_FULL",
        text: full.text,
        lines: full.lines,
      },
      {
        source: "TESSERACT_LINE",
        text: line.text,
        lines: line.lines,
      },
      {
        source: "TESSERACT_BOX",
        tokens: box.tokens,
      },
    ] as OCRResult["sources"];

    if (ENABLE_HOCR && hocr) {
      sources.push({
        source: "TESSERACT_HOCR",
        text: hocr.hocr,
        lines: [],
      } as any);
    }

    log.trace(
      "ocr_done",
      traceId,
      sources.map((s) =>
        "lines" in s
          ? { source: s.source, lines: s.lines.length }
          : { source: s.source, tokens: s.tokens.length }
      )
    );

    return { sources };
  } catch (err) {
    log.error("ocr_failed", err, traceId);

    return { sources: [] };
  }
}