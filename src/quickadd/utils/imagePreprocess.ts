// src/quickadd/utils/imagePreprocess.ts
import sharp from "sharp";

export async function preprocessImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize({ width: 2000 }) // 🔥 upscale → Tesseract lepiej czyta
    .grayscale()
    .linear(1.5, -10) // 🔥 boost kontrastu (lepsze niż normalize)
    .sharpen({ sigma: 1.2 })
    .median(1) // 🔥 usuwa szum (ważne przy UI)
    .threshold(140) // 🔥 lekko niżej niż 150 (lepiej łapie cienkie fonty)
    .toBuffer();
}