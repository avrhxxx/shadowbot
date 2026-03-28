// =====================================
// 📁 src/quickadd/ocr/OCREngine.ts
// =====================================

import Tesseract from "tesseract.js";
import { log } from "../logger";
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
  log.emit({
    event: "ocr_psm_start",
    traceId,
    type: "system",
    data: { psm, label },
  });

  const result = await Tesseract.recognize(
    buffer,
    "eng",
    {
      logger: () => {},
      tessedit_pageseg_mode: psm,
    } as any // ✅ FIX: typings workaround (tesseract.js issue)
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

  log.emit({
    event: "ocr_psm_done",
    traceId,
    type: "system",
    data: {
      label,
      lines: lines.length,
      tokens: tokens.length,
    },
  });

  return { text, lines, tokens };
}

// =====================================
// 🧠 GOOGLE VISION
// =====================================

async function runVision(
  buffer: Buffer,
  traceId: string
): Promise<OCRRunResult> {
  log.emit({
    event: "vision_start",
    traceId,
    type: "system",
  });

  try {
    const result = await runVisionOCR(buffer);

    const text =
      result?.fullTextAnnotation?.text ?? "";

    const lines = text.split("\n").filter(Boolean);

    const tokens: OCRToken[] = lines.map(
      (line: string, i: number) => ({
        text: line,
        x: 0,
        y: i * 10,
        width: line.length * 6,
        height: 10,
        confidence: 90,
      })
    );

    log.emit({
      event: "vision_done",
      traceId,
      type: "system",
      data: {
        lines: lines.length,
        tokens: tokens.length,
      },
    });

    return { text, lines, tokens };
  } catch (error) {
    log.emit({
      event: "vision_failed",
      traceId,
      type: "system",
      level: "warn",
      data: { error },
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
    log.emit({
      event: "hocr_start",
      traceId,
      type: "system",
    });

    const result = await Tesseract.recognize(
      buffer,
      "eng",
      {
        logger: () => {},
        tessedit_create_hocr: "1",
      } as any // ✅ FIX
    );

    const hocr = result.data.hocr || "";

    log.emit({
      event: "hocr_done",
      traceId,
      type: "system",
      data: { length: hocr.length },
    });

    return { hocr };
  },

  vision: (buffer: Buffer, traceId: string) =>
    runVision(buffer, traceId),
};