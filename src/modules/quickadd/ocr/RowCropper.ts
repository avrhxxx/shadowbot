/**
 * RowCropper.ts
 *
 * Wycinanie wykrytych wierszy z obrazu.
 */

import Jimp from "jimp";
import { RowRegion } from "./RowDetector";

export class RowCropper {
  /**
   * Wycinanie regionów z obrazu
   * @param imageBuffer Buffer oryginalnego obrazu
   * @param rows Tablica wykrytych wierszy
   * @returns Tablica wyciętych Bufferów wierszy
   */
  static async cropRows(imageBuffer: Buffer, rows: RowRegion[]): Promise<Buffer[]> {
    const image = await Jimp.read(imageBuffer);
    const croppedBuffers: Buffer[] = [];

    for (const row of rows) {
      const cropped = image.clone().crop(0, row.y, image.bitmap.width, row.height);
      const buf = await cropped.getBufferAsync(Jimp.MIME_PNG);
      croppedBuffers.push(buf);
    }

    return croppedBuffers;
  }
}