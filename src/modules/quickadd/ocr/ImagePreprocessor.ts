/**
 * ImagePreprocessor.ts
 *
 * Przetwarzanie obrazu przed OCR:
 * - grayscale
 * - kontrast
 * - resize
 * - sharpen
 * - adaptive threshold
 */

import Jimp from "jimp";

export class ImagePreprocessor {
  /**
   * Przygotowuje obraz do OCR
   * @param imageBuffer Buffer z obrazem
   * @returns przetworzony Buffer
   */
  static async preprocess(imageBuffer: Buffer): Promise<Buffer> {
    let image = await Jimp.read(imageBuffer);

    // 1️⃣ Resize (najdłuższa krawędź do 1600px)
    const maxSide = 1600;
    if (image.getWidth() > image.getHeight()) {
      image.resize(maxSide, Jimp.AUTO);
    } else {
      image.resize(Jimp.AUTO, maxSide);
    }

    // 2️⃣ Konwersja do grayscale
    image.grayscale();

    // 3️⃣ Zwiększenie kontrastu (~40%)
    image.contrast(0.4);

    // 4️⃣ Sharpening
    image.convolute([
      [ 0, -1,  0 ],
      [-1,  5, -1 ],
      [ 0, -1,  0 ]
    ]);

    // 5️⃣ Adaptive threshold – uproszczone binarization
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const pixel = this.bitmap.data;
      const gray = pixel[idx]; // grayscale więc R=G=B
      pixel[idx] = pixel[idx+1] = pixel[idx+2] = gray > 128 ? 255 : 0;
    });

    return await image.getBufferAsync(Jimp.MIME_PNG);
  }
}