/**
 * RowDetector.ts
 *
 * Wykrywa poziome wiersze na obrazie gry.
 * Każdy wiersz to osobny region do OCR.
 */

import Jimp from "jimp";

export interface RowRegion {
  y: number;
  height: number;
}

export class RowDetector {
  /**
   * Detekcja wierszy w obrazie
   * @param imageBuffer Buffer przetworzonego obrazu
   * @returns Tablica regionów {y, height} dla każdego wiersza
   */
  static async detectRows(imageBuffer: Buffer): Promise<RowRegion[]> {
    const image = await Jimp.read(imageBuffer);
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    const rowRegions: RowRegion[] = [];

    // Prosty projection analysis – poziome skany
    let inRow = false;
    let rowStart = 0;

    for (let y = 0; y < height; y++) {
      let hasDarkPixel = false;

      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) << 2;
        const pixel = image.bitmap.data;
        const gray = pixel[idx]; // grayscale → R=G=B
        if (gray < 200) { // czarny/prawie czarny
          hasDarkPixel = true;
          break;
        }
      }

      if (hasDarkPixel && !inRow) {
        // nowy wiersz startuje
        inRow = true;
        rowStart = y;
      }

      if (!hasDarkPixel && inRow) {
        // wiersz kończy się
        inRow = false;
        const rowHeight = y - rowStart;
        rowRegions.push({ y: rowStart, height: rowHeight });
      }
    }

    // Jeśli ostatni wiersz się kończy na końcu obrazu
    if (inRow) {
      rowRegions.push({ y: rowStart, height: height - rowStart });
    }

    return rowRegions;
  }
}