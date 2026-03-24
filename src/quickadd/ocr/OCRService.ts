// =====================================
// 📁 src/quickadd/ocr/OCRService.ts
// =====================================

import fetch from "node-fetch";
import { runFullImage, runLineBased, runBoxBased, runHOCR } from "./OCRRunner";
import { createLogger } from "../debug/DebugLogger";
import { OCRMultiResult, OCRSourceResult } from "./OCRTypes";

const log = createLogger("OCR");

// 🔥 FEATURE FLAGS
const USE_PREPROCESS = false; // toggle ON later
const ENABLE_HOCR = true;

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
    // 🔹 BUFFER SELECTION
    // =====================================
    let tesseractBuffer = buffer;

    if (USE_PREPROCESS) {
      // lazy import → nie psujemy flow gdy wyłączone
      const { preprocessBase, preprocessForTesseract } = await import("./OCRPreprocess");

      const base = await preprocessBase(buffer);
      tesseractBuffer = await preprocessForTesseract(base);

      log.trace("preprocess_enabled", traceId);
    } else {
      log.trace("preprocess_disabled", traceId);
    }

    // =====================================
    // 🔹 OCR RUNS
    // =====================================
    const tasks: Promise<any>[] = [
      runFullImage(tesseractBuffer, traceId),
      runLineBased(tesseractBuffer, traceId),
      runBoxBased(tesseractBuffer, traceId),
    ];

    if (ENABLE_HOCR) {
      tasks.push(runHOCR(tesseractBuffer, traceId));
    }

    const results = await Promise.all(tasks);

    const [full, line, box, hocr] = results;

    // =====================================
    // 🔹 SOURCES BUILD
    // =====================================
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

    if (ENABLE_HOCR && hocr) {
      sources.push({
        source: "TESSERACT_HOCR" as any, // 🔥 tym zajmiemy się w OCRTypes później
        text: hocr.hocr,
        lines: [],
      });
    }

    // =====================================
    // 🔥 DEBUG SUMMARY
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