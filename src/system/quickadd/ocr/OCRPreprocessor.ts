// =====================================
// 📁 src/quickadd/ocr/OCRPreprocessor.ts
// =====================================

import sharp from "sharp";
import { log } from "../../core/logger/log";
import { TraceContext } from "../../core/trace/TraceContext";

export const OCRPreprocessor = {
  async base(buffer: Buffer, ctx: TraceContext): Promise<Buffer> {
    const l = log.ctx(ctx);

    try {
      return await sharp(buffer)
        .rotate()
        .resize({ width: 1500, withoutEnlargement: true })
        .toBuffer();
    } catch (error) {
      l.error("pre_base_failed", {
        error,
      });
      return buffer;
    }
  },

  async enhance(buffer: Buffer, ctx: TraceContext): Promise<Buffer> {
    const l = log.ctx(ctx);

    try {
      return await sharp(buffer)
        .grayscale()
        .normalize()
        .sharpen()
        .toBuffer();
    } catch (error) {
      l.error("pre_enhance_failed", {
        error,
      });
      return buffer;
    }
  },
};