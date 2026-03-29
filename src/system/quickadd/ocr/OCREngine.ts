// =====================================
// 📁 src/quickadd/ocr/OCREngine.ts
// =====================================

import Tesseract from "tesseract.js";
import { log } from "../../core/logger/log";
import { OCRToken } from "./OCRTypes";
import { runVisionOCR } from "../../google/GoogleVisionService";
import { TraceContext } from "../../core/trace/TraceContext";

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
  ctx: TraceContext,
  psm: number,
  label: string
): Promise<OCRRunResult> {
  const l = log.ctx(ctx);

  l.event("ocr_psm_start", {
    psm,
    label,
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

    l.event("ocr_psm_done", {
      label,
      linesCount: lines.length,
      tokensCount: tokens.length,
    });

    return { text, lines, tokens };

  } catch (error) {
    l.warn("ocr_psm_failed", {
      label,
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
  ctx: TraceContext
): Promise<OCRRunResult> {
  const l = log.ctx(ctx);

  l.event("vision_start");

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
        confidence: 50,
      })
    );

    l.event("vision_done", {
      linesCount: lines.length,
      tokensCount: tokens.length,
    });

    return { text, lines, tokens };

  } catch (error) {
    l.warn("vision_failed", {
      error,
    });

    return { text: "", lines: [], tokens: [] };
  }
}

// =====================================
// 🚀 PUBLIC API
// =====================================

export const OCREngine = {
  full: (buffer: Buffer, ctx: TraceContext) =>
    runWithPSM(buffer, ctx, 6, "FULL"),

  line: (buffer: Buffer, ctx: TraceContext) =>
    runWithPSM(buffer, ctx, 11, "LINE"),

  box: (buffer: Buffer, ctx: TraceContext) =>
    runWithPSM(buffer, ctx, 4, "BOX"),

  async hocr(buffer: Buffer, ctx: TraceContext) {
    const l = log.ctx(ctx);

    l.event("hocr_start");

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

      l.event("hocr_done", {
        hocrLength: hocr.length,
      });

      return { hocr };

    } catch (error) {
      l.warn("hocr_failed", {
        error,
      });

      return { hocr: "" };
    }
  },

  vision: (buffer: Buffer, ctx: TraceContext) =>
    runVision(buffer, ctx),
};