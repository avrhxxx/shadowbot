// src/quickadd/ocr/OCRPreprocess.ts

import sharp from "sharp";

export async function preprocessImage(
  buffer: Buffer
): Promise<Buffer> {
  return sharp(buffer)
    .resize({ width: 2000 })
    .grayscale()
    .normalize()
    .toBuffer();
}