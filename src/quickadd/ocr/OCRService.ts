// =====================================
// 📁 src/quickadd/ocr/OCRService.ts
// =====================================

import fetch from "node-fetch";
import { preprocessBase, preprocessForTesseract } from "./OCRPreprocess";
import { runFullImage, runLineBased, runBoxBased } from "./OCRRunner";
import { createLogger } from "../debug/DebugLogger";
import { OCRMultiResult } from "./OCRTypes";

const log = createLogger("OCR");

export async function runOCR(imageUrl: string, traceId: string): Promise<OCRMultiResult> {
  log.trace("ocr_start", traceId, imageUrl);

  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    log.trace("image_downloaded", traceId, { size: buffer.length });

    // =====================================
    // 🔹 BASE PREPROCESS
    // =====================================
    const base = await preprocessBase(buffer);

    // =====================================
    // 🔹 ENGINE PREPROCESS
    // =====================================
    const tesseractBuffer = await preprocessForTesseract(base);

    // =====================================
    // 🔹 RUN TESSERACT
    // =====================================
    const [full, line, box] = await Promise.all([
      runFullImage(tesseractBuffer, traceId),
      runLineBased(tesseractBuffer, traceId),
      runBoxBased(tesseractBuffer, traceId),
    ]);

    const sources = [
      {
        source: "TESSERACT_FULL" as const,
        text: full.text,
        lines: full.lines,
      },
      {
        source: "TESSERACT_LINE" as const,
        text: line.text,
        lines: line.lines,
      },
      {
        source: "TESSERACT_BOX" as const,
        tokens: box.tokens,
      },
    ];

    // =====================================
    // 🔥 OCR SPACE (PLACEHOLDER - FUTURE)
    // =====================================
    // TODO: add OCR Space integration here

    // =====================================
    // 🔥 DEBUG (FIXED TYPE NARROWING)
    // =====================================
    log.trace("ocr_multi_done", traceId, {
      sources: sources.map((s) => {
        if ("lines" in s) {
          return {
            source: s.source,
            lines: s.lines.length,
            textLength: s.text.length,
          };
        }

        if ("tokens" in s) {
          return {
            source: s.source,
            tokens: s.tokens.length,
          };
        }

        return {
          source: s.source,
        };
      }),
    });

    return { sources };
  } catch (err) {
    log.error("ocr_error", err, traceId);

    return {
      sources: [],
    };
  }
}