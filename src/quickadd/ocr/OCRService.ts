// =====================================
// 📁 src/quickadd/ocr/OCRService.ts
// =====================================

import fetch from "node-fetch";
import { preprocessImage } from "./OCRPreprocess";
import { runFullImage } from "./OCRRunner";
import { createLogger } from "../debug/DebugLogger";

const log = createLogger("OCR");

export async function runOCR(imageUrl: string) {
  log("ocr_start", imageUrl);

  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    log("image_downloaded", {
      size: buffer.length,
    });

    const processed = await preprocessImage(buffer);

    const result = await runFullImage(processed);

    log("ocr_done", {
      textLength: result.text.length,
      lines: result.lines.length,
    });

    return result;
  } catch (err) {
    log.error("ocr_error", err);

    return {
      text: "",
      lines: [],
    };
  }
}