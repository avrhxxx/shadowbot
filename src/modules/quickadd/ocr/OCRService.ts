import { OCRRunner } from "./OCRRunner";
import { OCRResult } from "../types/OCRResult";

export class OCRService {
  async processImage(imageBuffer: Buffer): Promise<OCRResult[]> {
    // 🔹 placeholder: integruje OCRRunner i zwraca wynik
    const results: OCRResult[] = await OCRRunner.runOCR(imageBuffer);
    return results;
  }
}