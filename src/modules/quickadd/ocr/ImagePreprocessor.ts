import Jimp from "jimp";

/**
 * ImagePreprocessor - przygotowuje obraz do OCR
 * - zmiana rozmiaru
 * - grayscale
 * - kontrast
 * - wyostrzenie
 * - threshold adaptacyjny
 */
export class ImagePreprocessor {
  /**
   * Przygotowuje obraz do OCR
   * @param buffer Buffer z obrazem
   * @returns przetworzony obraz jako Jimp
   */
  public static async preprocess(buffer: Buffer): Promise<Jimp> {
    const image = await Jimp.read(buffer);

    // normalizacja rozmiaru - najdłuższy bok 1600px
    const maxSide = Math.max(image.getWidth(), image.getHeight());
    if (maxSide !== 1600) {
      image.scale(1600 / maxSide);
    }

    // grayscale i kontrast
    image.grayscale();
    image.contrast(0.4);

    // wyostrzenie
    image.convolute([
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0],
    ]);

    // threshold adaptacyjny (przykład prosty)
    image.threshold({ max: 200 });

    return image;
  }
}