// =====================================
// 📁 src/quickadd/ocr/OCRPreprocessor.ts
// =====================================

import sharp from "sharp";
import { createScopedLogger } from "@/quickadd/debug/logger";

const log = createScopedLogger(import.meta.url);

export const OCRPreprocessor = {
  async base(buffer: Buffer, traceId: string): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .rotate()
        .resize({ width: 1500, withoutEnlargement: true })
        .toBuffer();
    } catch (error) {
      log.error("pre_base_failed", error, traceId);
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
      log.error("pre_enhance_failed", error, traceId);
      return buffer;
    }
  },
};