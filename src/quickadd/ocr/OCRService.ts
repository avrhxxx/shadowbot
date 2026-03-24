// =====================================
// 📁 src/quickadd/ocr/OCRService.ts
// =====================================

import fetch from "node-fetch";
import { preprocessBase, preprocessForTesseract } from "./OCRPreprocess";
import { runFullImage, runLineBased, runBoxBased } from "./OCRRunner";
import { createLogger } from "../debug/DebugLogger";
import { OCRMultiResult, OCRSourceResult } from "./OCRTypes";

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

    const base = await preprocessBase(buffer);
    const tesseractBuffer = await preprocessForTesseract(base);

    const [full, line, box] = await Promise.all([
      runFullImage(tesseractBuffer, traceId),
      runLineBased(tesseractBuffer, traceId),
      runBoxBased(tesseractBuffer, traceId),
    ]);

    const sources: OCRSourceResult[] = [
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

    // =====================================
    // 🔥 SAFE DEBUG (FIXED)
    // =====================================
    log.trace(
      "ocr_multi_done",
      traceId,
      sources.map((s) => {
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

        // 🔥 TS FIX — wymuszenie typu
        return {
          source: (s as OCRSourceResult).source,
        };
      })
    );

    return { sources };
  } catch (err) {
    log.error("ocr_error", err, traceId);

    return {
      sources: [],
    };
  }
}