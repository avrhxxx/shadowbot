// =====================================
// 📁 src/quickadd/ocr/OCREngine.ts
// =====================================

import Tesseract from "tesseract.js";
import { logger } from "../../core/logger/log";
import { OCRToken } from "./OCRTypes";
import { runVisionOCR } from "../../google/GoogleVisionService";

// =====================================
// 🧱 TYPES
// =====================================

type OCRRunResult = {
  text: string;
  lines: string[];
  tokens: OCRToken[];
};

// =====================================
// 🧠 TESSERACT RUNNER
// =====================================

async function runWithPSM(
  buffer: Buffer,
  traceId: string,
  psm: number,
  label: string
): Promise<OCRRunResult> {
  logger.emit({
    scope: "quickadd.ocr",
    event: "ocr_psm_start",
    traceId,
    context: { psm, label },
  });

  try {
    const result = await Tesseract.recognize(
      buffer,
      "eng",
      {
        logger: () => {},
        tessedit_pageseg_mode: psm,
      } as any
    );

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

    logger.emit({
      scope: "quickadd.ocr",
      event: "ocr_psm_done",
      traceId,
      context: {
        label,
        linesCount: lines.length,
        tokensCount: tokens.length,
      },
    });

    return { text, lines, tokens };

  } catch (error) {
    logger.emit({
      scope: "quickadd.ocr",
      event: "ocr_psm_failed",
      traceId,
      level: "warn",
      context: { label },
      error,
    });

    return { text: "", lines: [], tokens: [] };
  }
}

// =====================================
// 🧠 GOOGLE VISION
// =====================================

async function runVision(
  buffer: Buffer,
  traceId: string
): Promise<OCRRunResult> {
  logger.emit({
    scope: "quickadd.ocr",
    event: "vision_start",
    traceId,
  });

  try {
    const result = await runVisionOCR(buffer);

    const text =
      result?.fullTextAnnotation?.text ?? "";

    const lines = text.split("\n").filter(Boolean);

    // ⚠️ fallback tokens (low-quality)
    const tokens: OCRToken[] = lines.map(
      (line: string, i: number) => ({
        text: line,
        x: 0,
        y: i * 10,
        width: line.length * 6,
        height: 10,
        confidence: 50, // lower confidence (important!)
      })
    );

    logger.emit({
      scope: "quickadd.ocr",
      event: "vision_done",
      traceId,
      context: {
        linesCount: lines.length,
        tokensCount: tokens.length,
      },
    });

    return { text, lines, tokens };

  } catch (error) {
    logger.emit({
      scope: "quickadd.ocr",
      event: "vision_failed",
      traceId,
      level: "warn",
      error,
    });

    return { text: "", lines: [], tokens: [] };
  }
}

// =====================================
// 🚀 PUBLIC API
// =====================================

export const OCREngine = {
  full: (buffer: Buffer, traceId: string) =>
    runWithPSM(buffer, traceId, 6, "FULL"),

  line: (buffer: Buffer, traceId: string) =>
    runWithPSM(buffer, traceId, 11, "LINE"),

  box: (buffer: Buffer, traceId: string) =>
    runWithPSM(buffer, traceId, 4, "BOX"),

  async hocr(buffer: Buffer, traceId: string) {
    logger.emit({
      scope: "quickadd.ocr",
      event: "hocr_start",
      traceId,
    });

    try {
      const result = await Tesseract.recognize(
        buffer,
        "eng",
        {
          logger: () => {},
          tessedit_create_hocr: "1",
        } as any
      );

      const hocr = result.data.hocr || "";

      logger.emit({
        scope: "quickadd.ocr",
        event: "hocr_done",
        traceId,
        context: { hocrLength: hocr.length },
      });

      return { hocr };

    } catch (error) {
      logger.emit({
        scope: "quickadd.ocr",
        event: "hocr_failed",
        traceId,
        level: "warn",
        error,
      });

      return { hocr: "" };
    }
  },

  vision: (buffer: Buffer, traceId: string) =>
    runVision(buffer, traceId),
};