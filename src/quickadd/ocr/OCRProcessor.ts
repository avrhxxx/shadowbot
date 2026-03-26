// =====================================
// 📁 src/quickadd/ocr/OCRProcessor.ts
// =====================================

/**
 * 🔥 ROLE:
 * OCR orchestrator (data extraction layer ONLY).
 *
 * Responsible for:
 * - downloading image
 * - preprocessing (optional)
 * - running multiple OCR modes
 * - aggregating results
 *
 * ❗ DOES NOT:
 * - build layout
 * - parse data
 * - validate
 */

import fetch from "node-fetch";
import { createLogger } from "../debug/DebugLogger";
import { OCREngine } from "./OCREngine";
import { OCRResult } from "./OCRTypes";

// 🔥 NEW
import { runVisionOCR } from "../../google/GoogleVisionService";
import { mapVisionToTokens } from "./VisionOCRAdapter";

const log = createLogger("OCR_PROCESSOR");

// 🔥 FEATURE FLAGS
const USE_PREPROCESS = false;
const ENABLE_HOCR = true;

export async function runOCR(
  imageUrl: string,
  traceId: string
): Promise<OCRResult> {
  const startedAt = Date.now();

  log.trace("ocr_input", traceId, {
    imageUrl,
    flags: {
      USE_PREPROCESS,
      ENABLE_HOCR,
    },
  });

  try {
    // =====================================
    // 🌐 FETCH IMAGE
    // =====================================
    log.trace("fetch_start", traceId);

    const res = await fetch(imageUrl);

    if (!res.ok) {
      log.warn("fetch_failed", traceId, {
        status: res.status,
      });

      throw new Error(`fetch_failed: ${res.status}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());

    log.trace("image_loaded", traceId, {
      size: buffer.length,
    });

    let inputBuffer = buffer;

    // =====================================
    // 🧪 PREPROCESS (optional)
    // =====================================
    if (USE_PREPROCESS) {
      log.trace("preprocess_start", traceId);

      const { OCRPreprocessor } = await import("./OCRPreprocessor");

      const base = await OCRPreprocessor.base(buffer);
      inputBuffer = await OCRPreprocessor.enhance(base);

      log.trace("preprocess_done", traceId, {
        originalSize: buffer.length,
        finalSize: inputBuffer.length,
      });
    } else {
      log.trace("preprocess_skipped", traceId);
    }

    // =====================================
    // 🔥 GOOGLE VISION (PRIMARY)
    // =====================================
    log.trace("vision_ocr_start", traceId);

    let visionTokens: any[] = [];

    try {
      const visionResult = await runVisionOCR(inputBuffer);

      if (visionResult) {
        visionTokens = mapVisionToTokens(visionResult, traceId);
      }

      log.trace("vision_ocr_done", traceId, {
        tokens: visionTokens.length,
      });

    } catch (err) {
      log.warn("vision_ocr_failed", traceId, {
        error: err,
      });
    }

    // =====================================
    // 🤖 RUN OCR ENGINES (TESSERACT)
    // =====================================
    log.trace("ocr_engines_start", traceId);

    const [full, line, box] = await Promise.all([
      OCREngine.full(inputBuffer, traceId),
      OCREngine.line(inputBuffer, traceId),
      OCREngine.box(inputBuffer, traceId),
    ]);

    log.trace("ocr_engines_done", traceId, {
      full_lines: full.lines.length,
      line_lines: line.lines.length,
      box_tokens: box.tokens.length,
    });

    // =====================================
    // 🧾 HOCR (OPTIONAL)
    // =====================================
    let hocrResult: { hocr: string } | null = null;

    if (ENABLE_HOCR) {
      try {
        log.trace("hocr_start", traceId);

        hocrResult = await OCREngine.hocr(inputBuffer, traceId);

        log.trace("hocr_done", traceId, {
          length: hocrResult.hocr.length,
        });
      } catch (err) {
        log.warn("hocr_failed", traceId, {
          error: err,
        });
      }
    } else {
      log.trace("hocr_disabled", traceId);
    }

    // =====================================
    // 🧱 BUILD SOURCES
    // =====================================
    const sources: OCRResult["sources"] = [
      {
        source: "VISION",
        tokens: visionTokens,
      },
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
    ];

    if (ENABLE_HOCR && hocrResult) {
      sources.push({
        source: "TESSERACT_HOCR",
        text: hocrResult.hocr,
        lines: [],
      });
    }

    // =====================================
    // 📤 OUTPUT SUMMARY
    // =====================================
    log.trace(
      "ocr_output",
      traceId,
      sources.map((s) => {
        if ("tokens" in s) {
          return { source: s.source, tokens: s.tokens.length };
        }

        return { source: s.source, lines: s.lines.length };
      })
    );

    log.trace("ocr_duration", traceId, {
      durationMs: Date.now() - startedAt,
    });

    return { sources };

  } catch (err) {
    log.error("ocr_failed", err, traceId);

    log.trace("ocr_duration_failed", traceId, {
      durationMs: Date.now() - startedAt,
    });

    return { sources: [] };
  }
}