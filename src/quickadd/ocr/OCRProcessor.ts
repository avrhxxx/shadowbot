// =====================================
// 📁 src/quickadd/ocr/OCRProcessor.ts
// =====================================

import fetch from "node-fetch";
import { createScopedLogger } from "@/quickadd/debug/logger";
import { OCREngine } from "./OCREngine";
import { OCRResult } from "./OCRTypes";
import { runVisionOCR } from "../../google/GoogleVisionService";
import { mapVisionToTokens } from "./VisionOCRExtractor";

const log = createScopedLogger(import.meta.url);

const USE_PREPROCESS = false;
const ENABLE_HOCR = true;

export async function runOCR(
  imageUrl: string,
  traceId: string
): Promise<OCRResult> {
  const startedAt = Date.now();

  log.trace("ocr_input", traceId, {
    imageUrl,
    flags: { USE_PREPROCESS, ENABLE_HOCR },
  });

  try {
    log.trace("fetch_start", traceId);

    const res = await fetch(imageUrl);

    if (!res.ok) {
      log.warn("fetch_failed", traceId, { status: res.status });
      throw new Error(`fetch_failed: ${res.status}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());

    log.trace("image_loaded", traceId, {
      size: buffer.length,
    });

    let inputBuffer = buffer;

    if (USE_PREPROCESS) {
      const { OCRPreprocessor } = await import("./OCRPreprocessor");

      const base = await OCRPreprocessor.base(buffer, traceId);
      inputBuffer = await OCRPreprocessor.enhance(base, traceId);
    }

    // 🔥 Vision
    let visionTokens = [];

    try {
      const visionResult = await runVisionOCR(inputBuffer);

      if (visionResult) {
        visionTokens = mapVisionToTokens(visionResult, traceId);
      }
    } catch (error) {
      log.warn("vision_ocr_failed", traceId, { error });
    }

    // 🤖 Tesseract
    const [full, line, box] = await Promise.all([
      OCREngine.full(inputBuffer, traceId),
      OCREngine.line(inputBuffer, traceId),
      OCREngine.box(inputBuffer, traceId),
    ]);

    let hocrResult: { hocr: string } | null = null;

    if (ENABLE_HOCR) {
      try {
        hocrResult = await OCREngine.hocr(inputBuffer, traceId);
      } catch (error) {
        log.warn("hocr_failed", traceId, { error });
      }
    }

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

    log.trace("ocr_duration", traceId, {
      durationMs: Date.now() - startedAt,
    });

    return { sources };

  } catch (error) {
    log.error("ocr_failed", error, traceId);

    return { sources: [] };
  }
}