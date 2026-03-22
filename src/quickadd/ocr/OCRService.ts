// src/quickadd/ocr/OCRService.ts

import fetch from "node-fetch";
import { preprocessImage } from "./OCRPreprocess";
import { runFullImage } from "./OCRRunner";
import { debug } from "../debug/DebugLogger";

const SCOPE = "OCR";

export async function runOCR(imageUrl: string) {
  debug(SCOPE, "OCR_START", imageUrl);

  try {
    // =============================
    // 🔽 DOWNLOAD IMAGE
    // =============================
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // =============================
    // 🧪 PREPROCESS
    // =============================
    const processed = await preprocessImage(buffer);

    // =============================
    // 🔍 OCR (NA RAZIE FULL ONLY)
    // =============================
    const result = await runFullImage(processed);

    debug(SCOPE, "OCR_DONE", result);

    return result;
  } catch (err) {
    debug(SCOPE, "OCR_ERROR", err);

    return {
      text: "",
      lines: [],
    };
  }
}