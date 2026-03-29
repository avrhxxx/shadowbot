// =====================================
// 📁 src/quickadd/ocr/OCRPreprocessor.ts
// =====================================

import sharp from "sharp";
import { logger } from "../../core/logger/log";

export const OCRPreprocessor = {
  async base(buffer: Buffer, traceId: string): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .rotate()
        .resize({ width: 1500, withoutEnlargement: true })
        .toBuffer();
    } catch (error) {
      logger.emit({
        scope: "quickadd.ocr.preprocessor",
        event: "pre_base_failed",
        traceId,
        level: "error",
        error,
      });
      return buffer;
    }
  },

  async enhance(buffer: Buffer, traceId: string): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .grayscale()
        .normalize()
        .sharpen()
        .toBuffer();
    } catch (error) {
      logger.emit({
        scope: "quickadd.ocr.preprocessor",
        event: "pre_enhance_failed",
        traceId,
        level: "error",
        error,
      });
      return buffer;
    }
  },
};