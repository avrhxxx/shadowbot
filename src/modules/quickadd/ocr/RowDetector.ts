import Jimp from "jimp";

/**
 * RowDetector - dzieli obraz wiersze gry (UI)
 * wykorzystuje projekcję poziomą lub separatory
 */
export class RowDetector {
  /**
   * Detekcja wierszy w obrazie
   * @param image Jimp obraz przetworzony
   * @returns tablica { y: number, height: number }
   */
  public static detectRows(image: Jimp): { y: number; height: number }[] {
    const rows: { y: number; height: number }[] = [];
    const height = image.getHeight();
    const width = image.getWidth();

    // bardzo prosta analiza: każda linia o stałej wysokości ~40px
    const rowHeight = 40;
    for (let y = 0; y < height; y += rowHeight) {
      rows.push({ y, height: Math.min(rowHeight, height - y) });
    }

    return rows;
  }
}