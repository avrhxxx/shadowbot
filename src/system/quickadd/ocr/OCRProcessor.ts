// =====================================
// 📁 src/quickadd/ocr/OCRProcessor.ts
// =====================================

import fetch from "node-fetch";
import { logger } from "../../core/logger/log";
import { OCREngine } from "./OCREngine";
import { OCRResult, OCRToken } from "./OCRTypes";
import { runVisionOCR } from "../../google/GoogleVisionService";
import { mapVisionToTokens } from "./VisionOCRExtractor";

const USE_PREPROCESS = false;
const ENABLE_HOCR = true;

export async function runOCR(
  imageUrl: string,
  traceId: string
): Promise<OCRResult> {
  const startedAt = Date.now();

  logger.emit({
    event: "ocr_input",
    traceId,
    context: {
      imageUrl,
      flags: { USE_PREPROCESS, ENABLE_HOCR },
    },
  });

  try {
    logger.emit({
      event: "fetch_start",
      traceId,
    });

    const res = await fetch(imageUrl);

    if (!res.ok) {
      logger.emit({
        event: "fetch_failed",
        traceId,
        level: "warn",
        context: { status: res.status },
      });

      throw new Error(`fetch_failed: ${res.status}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());

    logger.emit({
      event: "image_loaded",
      traceId,
      context: {
        size: buffer.length,
      },
    });

    let inputBuffer = buffer;

    // =====================================
    // 🔧 PREPROCESS (OPTIONAL)
    // =====================================
    if (USE_PREPROCESS) {
      const { OCRPreprocessor } = await import("./OCRPreprocessor.js");

      const base = await OCRPreprocessor.base(buffer, traceId);
      inputBuffer = await OCRPreprocessor.enhance(base, traceId);
    }

    // =====================================
    // 🔥 GOOGLE VISION
    // =====================================
    let visionTokens: OCRToken[] = [];

    try {
      const visionResult = await runVisionOCR(inputBuffer);

      if (visionResult?.fullTextAnnotation?.text) {
        visionTokens = mapVisionToTokens(
          visionResult as any,
          traceId
        );
      }
    } catch (error) {
      logger.emit({
        event: "vision_ocr_failed",
        traceId,
        level: "warn",
        error,
      });
    }

    // =====================================
    // 🤖 TESSERACT
    // =====================================
    const [full, line, box] = await Promise.all([
      OCREngine.full(inputBuffer, traceId),
      OCREngine.line(inputBuffer, traceId),
      OCREngine.box(inputBuffer, traceId),
    ]);

    // =====================================
    // 📄 HOCR (OPTIONAL)
    // =====================================
    let hocrResult: { hocr: string } | null = null;

    if (ENABLE_HOCR) {
      try {
        hocrResult = await OCREngine.hocr(inputBuffer, traceId);
      } catch (error) {
        logger.emit({
          event: "hocr_failed",
          traceId,
          level: "warn",
          error,
        });
      }
    }

    // =====================================
    // 📦 BUILD RESULT
    // =====================================
    const sources: OCRResult["sources"] = [
      { source: "VISION", tokens: visionTokens },
      { source: "TESSERACT_FULL", text: full.text, lines: full.lines },
      { source: "TESSERACT_LINE", text: line.text, lines: line.lines },
      { source: "TESSERACT_BOX", tokens: box.tokens },
    ];

    if (ENABLE_HOCR && hocrResult) {
      sources.push({
        source: "TESSERACT_HOCR",
        text: hocrResult.hocr,
        lines: [],
      });
    }

    logger.emit({
      event: "ocr_done",
      traceId,
      context: {
        durationMs: Date.now() - startedAt,
        sources: sources.length,
      },
    });

    return { sources };

  } catch (error) {
    logger.emit({
      event: "ocr_failed",
      traceId,
      level: "error",
      error,
      context: {
        durationMs: Date.now() - startedAt,
      },
    });

    return { sources: [] };
  }
}