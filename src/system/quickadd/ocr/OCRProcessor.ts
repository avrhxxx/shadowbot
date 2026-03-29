// =====================================
// 📁 src/quickadd/ocr/OCRProcessor.ts
// =====================================

import fetch from "node-fetch";
import { log } from "../../core/logger/log";
import { OCREngine } from "./OCREngine";
import { OCRResult, OCRToken } from "./OCRTypes";
import { runVisionOCR } from "../../google/GoogleVisionService";
import { mapVisionToTokens } from "./VisionOCRExtractor";
import { TraceContext } from "../../core/trace/TraceContext";

const USE_PREPROCESS = false;
const ENABLE_HOCR = true;

export async function runOCR(
  imageUrl: string,
  ctx: TraceContext
): Promise<OCRResult> {
  const l = log.ctx(ctx);
  const startedAt = Date.now();

  l.event("ocr_input", {
    imageUrl,
    flags: { USE_PREPROCESS, ENABLE_HOCR },
  });

  try {
    l.event("fetch_start");

    const res = await fetch(imageUrl);

    if (!res.ok) {
      l.warn("fetch_failed", {
        status: res.status,
      });

      throw new Error(`fetch_failed: ${res.status}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());

    l.event("image_loaded", {
      size: buffer.length,
    });

    let inputBuffer = buffer;

    // =====================================
    // 🔧 PREPROCESS (OPTIONAL)
    // =====================================
    if (USE_PREPROCESS) {
      const { OCRPreprocessor } = await import("./OCRPreprocessor.js");

      const base = await OCRPreprocessor.base(buffer, ctx);
      inputBuffer = await OCRPreprocessor.enhance(base, ctx);
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
          ctx
        );
      }
    } catch (error) {
      l.warn("vision_ocr_failed", {
        error,
      });
    }

    // =====================================
    // 🤖 TESSERACT
    // =====================================
    const [full, line, box] = await Promise.all([
      OCREngine.full(inputBuffer, ctx),
      OCREngine.line(inputBuffer, ctx),
      OCREngine.box(inputBuffer, ctx),
    ]);

    // =====================================
    // 📄 HOCR (OPTIONAL)
    // =====================================
    let hocrResult: { hocr: string } | null = null;

    if (ENABLE_HOCR) {
      try {
        hocrResult = await OCREngine.hocr(inputBuffer, ctx);
      } catch (error) {
        l.warn("hocr_failed", {
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

    l.event("ocr_done", {
      sources: sources.length,
    }, {
      durationMs: Date.now() - startedAt,
    });

    return { sources };

  } catch (error) {
    l.error("ocr_failed", {
      error,
    }, {
      durationMs: Date.now() - startedAt,
    });

    return { sources: [] };
  }
}