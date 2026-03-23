// =====================================
// 📁 src/quickadd/ocr/OCRPreprocess.ts
// =====================================

import sharp from "sharp";
import { createLogger } from "../debug/DebugLogger";

const log = createLogger("OCR");

export async function preprocessImage(buffer: Buffer): Promise<Buffer> {
  log("preprocess_start");

  try {
    const processed = await sharp(buffer)
      .grayscale()
      .normalize()
      .sharpen()
      .resize({ width: 1500 })
      .toBuffer();

    log("preprocess_done");

    return processed;
  } catch (err) {
    log.error("preprocess_error", err);
    return buffer;
  }
}