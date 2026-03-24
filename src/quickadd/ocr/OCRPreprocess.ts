// =====================================
// 📁 src/quickadd/ocr/OCRPreprocess.ts
// =====================================

import sharp from "sharp";
import { createLogger } from "../debug/DebugLogger";

const log = createLogger("OCR");

// =====================================
// 🔹 BASE PREPROCESS (SAFE)
// =====================================
export async function preprocessBase(buffer: Buffer): Promise<Buffer> {
  log("preprocess_base_start");

  try {
    const processed = await sharp(buffer)
      .rotate() // auto orientation
      .resize({ width: 1500, withoutEnlargement: true })
      .toBuffer();

    log("preprocess_base_done");
    return processed;
  } catch (err) {
    log.error("preprocess_base_error", err);
    return buffer;
  }
}

// =====================================
// 🔹 TESSERACT PREPROCESS
// =====================================
export async function preprocessForTesseract(buffer: Buffer): Promise<Buffer> {
  log("preprocess_tesseract_start");

  try {
    const processed = await sharp(buffer)
      .grayscale()
      .normalize()
      .sharpen()
      .toBuffer();

    log("preprocess_tesseract_done");
    return processed;
  } catch (err) {
    log.error("preprocess_tesseract_error", err);
    return buffer;
  }
}