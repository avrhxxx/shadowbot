import sharp from "sharp";

export class ImagePreprocessor {
  static async preprocess(buffer: Buffer): Promise<Buffer> {
    // resize: longest side 1600px
    const image = sharp(buffer);
    const metadata = await image.metadata();
    const maxSide = Math.max(metadata.width || 0, metadata.height || 0);
    const scale = 1600 / maxSide;

    return image
      .resize(Math.round((metadata.width || 0) * scale), Math.round((metadata.height || 0) * scale))
      .grayscale()
      .linear(1, 0) // kontrast
      .sharpen()
      .threshold(150)
      .toBuffer();
  }
}