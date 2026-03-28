// =====================================
// 📁 src/quickadd/ocr/OCRPreprocessor.ts
// =====================================

import sharp from "sharp";
import { log } from "../logger";

export const OCRPreprocessor = {
  async base(buffer: Buffer, traceId: string): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .rotate()
        .resize({ width: 1500, withoutEnlargement: true })
        .toBuffer();
    } catch (error) {
      log.emit({
        event: "pre_base_failed",
        traceId,
        type: "system",
        level: "error",
        data: { error },
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
      log.emit({
        event: "pre_enhance_failed",
        traceId,
        type: "system",
        level: "error",
        data: { error },
      });
      return buffer;
    }
  },
};