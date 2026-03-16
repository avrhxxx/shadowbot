/**
 * OCRRunner.ts
 *
 * Moduł odpowiedzialny za wyciąganie tekstu z wyciętych wierszy obrazu.
 */

import Tesseract from "tesseract.js";

export interface OCRResult {
  text: string;
  confidence: number;
}

export class OCRRunner {
  /**
   * Przetwarzanie pojedynczego wiersza obrazu
   * @param rowBuffer Buffer wyciętego wiersza
   * @returns Tekst + confidence
   */
  static async runOCR(rowBuffer: Buffer): Promise<OCRResult> {
    const { data } = await Tesseract.recognize(rowBuffer, "eng+rus+ukr", {
      logger: (m) => {} // opcjonalnie można logować postęp
    });

    const text = data.text.trim();
    const confidence = data.confidence || 0;

    return { text, confidence };
  }

  /**
   * Przetwarzanie wielu wierszy równolegle
   * @param rowBuffers Tablica Bufferów wierszy
   * @returns Tablica wyników OCR
   */
  static async runMultiple(rowBuffers: Buffer[]): Promise<OCRResult[]> {
    const results = [];
    for (const buf of rowBuffers) {
      const res = await OCRRunner.runOCR(buf);
      results.push(res);
    }
    return results;
  }
}