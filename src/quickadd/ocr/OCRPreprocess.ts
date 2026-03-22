// src/quickadd/ocr/OCRPreprocess.ts

import sharp from "sharp";
import { debug } from "../debug/DebugLogger";

const SCOPE = "OCR";

export async function preprocessImage(buffer: Buffer): Promise<Buffer> {
  debug(SCOPE, "PREPROCESS_START");

  try {
    const processed = await sharp(buffer)
      .grayscale()              // 🔥 usuwa kolory (lepszy kontrast)
      .normalize()              // 🔥 poprawia kontrast
      .sharpen()                // 🔥 wyostrzenie tekstu
      .resize({ width: 1500 })  // 🔥 upscale dla OCR
      .toBuffer();

    debug(SCOPE, "PREPROCESS_DONE");

    return processed;
  } catch (err) {
    debug(SCOPE, "PREPROCESS_ERROR", err);
    return buffer; // fallback
  }
}