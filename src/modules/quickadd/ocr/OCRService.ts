/**
 * OCRService.ts
 *
 * Centralny serwis do przetwarzania obrazów i wyciągania tekstu
 * Używany przez QuickAdd dla wszystkich eventów
 */

import { ImagePreprocessor } from "./ImagePreprocessor";
import { RowDetector } from "./RowDetector";
import { RowCropper } from "./RowCropper";
import { OCRRunner } from "./OCRRunner";

export class OCRService {
  /**
   * Przetwarza pojedynczy obraz (screenshot) i zwraca tablicę linii tekstu
   */
  static async processImage(imageBuffer: Buffer): Promise<string[]> {
    // 1️⃣ Preprocessing obrazu
    const preprocessed = await ImagePreprocessor.preprocess(imageBuffer);

    // 2️⃣ Detekcja wierszy w obrazie
    const rows = await RowDetector.detectRows(preprocessed);

    // 3️⃣ Cropowanie każdego wiersza
    const croppedRows = await Promise.all(rows.map(row => RowCropper.cropRow(preprocessed, row)));

    // 4️⃣ OCR dla każdego wiersza
    const textLines = await Promise.all(croppedRows.map(rowImg => OCRRunner.runOCR(rowImg)));

    // 5️⃣ Zwracamy tekst w kolejności wierszy
    return textLines;
  }
}