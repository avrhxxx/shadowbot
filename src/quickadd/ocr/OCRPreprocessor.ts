// =====================================
// 📁 src/quickadd/ocr/OCRPreprocessor.ts
// =====================================

/**
 * 🧼 ROLE:
 * Image preprocessing before OCR.
 *
 * Optional step controlled by OCRProcessor.
 */

import sharp from "sharp";
import { createLogger } from "../debug/DebugLogger";

const log = createLogger("OCR_PRE");

export const OCRPreprocessor = {
  async base(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .rotate()
        .resize({ width: 1500, withoutEnlargement: true })
        .toBuffer();
    } catch (err) {
      log.error("pre_base_failed", err);
      return buffer;
    }
  },

  async enhance(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .grayscale()
        .normalize()
        .sharpen()
        .toBuffer();
    } catch (err) {
      log.error("pre_enhance_failed", err);
      return buffer;
    }
  },
};