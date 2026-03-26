// =====================================
// 📁 src/quickadd/ocr/OCREngine.ts
// =====================================

/**
 * 🔧 ROLE:
 * Low-level OCR execution (multi-engine).
 *
 * Responsible for:
 * - running OCR with different engines (Tesseract + Vision)
 * - extracting tokens / lines / text
 *
 * ❗ NO orchestration here
 */

import Tesseract from "tesseract.js";
import { createLogger } from "../debug/DebugLogger";
import { OCRToken } from "./OCRTypes";

// 🔥 NEW
import { extractTextGoogle } from "../../google/GoogleVisionService";

const log = createLogger("OCR_ENGINE");

// =====================================
// 🔧 TESSERACT CORE
// =====================================

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
// 🔥 VISION ENGINE
// =====================================

async function runVision(buffer: Buffer, traceId: string) {
  log.trace("vision_start", traceId);

  try {
    const text = await extractTextGoogle(buffer);

    const lines = text.split("\n").filter(Boolean);

    // ⚠️ Vision nie daje bbox → robimy FAKE tokens
    const tokens: OCRToken[] = lines.map((line, i) => ({
      text: line,
      x: 0,
      y: i * 10,
      width: line.length * 6,
      height: 10,
      confidence: 90,
    }));

    log.trace("vision_done", traceId, {
      lines: lines.length,
      tokens: tokens.length,
    });

    return { text, lines, tokens };

  } catch (err) {
    log.warn("vision_failed", traceId, {
      error: err,
    });

    return {
      text: "",
      lines: [],
      tokens: [],
    };
  }
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

  // 🔥 NEW ENGINE
  vision: (buffer: Buffer, traceId: string) =>
    runVision(buffer, traceId),
};