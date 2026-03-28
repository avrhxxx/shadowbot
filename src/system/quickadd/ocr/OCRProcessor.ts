// =====================================
// 📁 src/quickadd/ocr/OCRProcessor.ts
// =====================================

import fetch from "node-fetch";
import { log } from "../logger";
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

  log.emit({
    event: "ocr_input",
    traceId,
    data: {
      imageUrl,
      flags: { USE_PREPROCESS, ENABLE_HOCR },
    },
  });

  try {
    log.emit({
      event: "fetch_start",
      traceId,
    });

    const res = await fetch(imageUrl);

    if (!res.ok) {
      log.emit({
        event: "fetch_failed",
        traceId,
        level: "warn",
        data: { status: res.status },
      });

      throw new Error(`fetch_failed: ${res.status}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());

    log.emit({
      event: "image_loaded",
      traceId,
      data: {
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

      // ✅ FIX: strict null guard + safe cast
      if (visionResult?.fullTextAnnotation?.text) {
        visionTokens = mapVisionToTokens(
          visionResult as any,
          traceId
        );
      }
    } catch (error) {
      log.emit({
        event: "vision_ocr_failed",
        traceId,
        level: "warn",
        data: { error },
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
        log.emit({
          event: "hocr_failed",
          traceId,
          level: "warn",
          data: { error },
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

    log.emit({
      event: "ocr_done",
      traceId,
      data: {
        durationMs: Date.now() - startedAt,
        sources: sources.length,
      },
    });

    return { sources };

  } catch (error) {
    log.emit({
      event: "ocr_failed",
      traceId,
      level: "error",
      data: {
        error,
        durationMs: Date.now() - startedAt,
      },
    });

    return { sources: [] };
  }
}