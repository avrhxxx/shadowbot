// =====================================
// 📁 src/quickadd/ocr/OCREngine.ts
// =====================================

/**
 * 🔧 ROLE:
 * Low-level OCR execution (Tesseract).
 *
 * Responsible for:
 * - running OCR with different PSM modes
 * - extracting tokens / lines / text
 *
 * ❗ NO orchestration here
 */

import Tesseract from "tesseract.js";
import { createLogger } from "../debug/DebugLogger";
import { OCRToken } from "./OCRTypes";

const log = createLogger("OCR_ENGINE");

async function runWithPSM(
  buffer: Buffer,
  traceId: string,
  psm: number,
  label: string
) {
  log.trace("ocr_psm_start", traceId, { psm, label });

  const result = await Tesseract.recognize(buffer, "eng", {
    logger: () => {},
    config: {
      tessedit_pageseg_mode: String(psm),
    },
  } as any);

  const text = result.data.text || "";
  const lines = text.split("\n");

  const tokens: OCRToken[] = (result.data.words || []).map((w: any) => ({
    text: w.text,
    x: w.bbox.x0,
    y: w.bbox.y0,
    width: w.bbox.x1 - w.bbox.x0,
    height: w.bbox.y1 - w.bbox.y0,
    confidence: w.confidence,
  }));

  log.trace("ocr_psm_done", traceId, {
    label,
    lines: lines.length,
    tokens: tokens.length,
  });

  return { text, lines, tokens };
}

// =====================================
// 🔹 MODES
// =====================================

export const OCREngine = {
  full: (buffer: Buffer, traceId: string) =>
    runWithPSM(buffer, traceId, 6, "FULL"),

  line: (buffer: Buffer, traceId: string) =>
    runWithPSM(buffer, traceId, 11, "LINE"),

  box: (buffer: Buffer, traceId: string) =>
    runWithPSM(buffer, traceId, 4, "BOX"),

  async hocr(buffer: Buffer, traceId: string) {
    const result = await Tesseract.recognize(buffer, "eng", {
      logger: () => {},
      config: {
        tessedit_create_hocr: "1",
      },
    } as any);

    return { hocr: result.data.hocr || "" };
  },
};