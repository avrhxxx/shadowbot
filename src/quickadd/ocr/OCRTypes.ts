// =====================================
// 📁 src/quickadd/ocr/OCRTypes.ts
// =====================================

import { OCRToken } from "./OCRRunner";

export type OCRSourceType =
  | "TESSERACT_FULL"
  | "TESSERACT_LINE"
  | "TESSERACT_BOX"
  | "OCRSPACE_FULL"
  | "OCRSPACE_LINE";

// 🔹 BASE (dla text OCR)
export interface OCRTextSourceResult {
  source: OCRSourceType;
  text: string;
  lines: string[];
}

// 🔹 BOX (layout OCR)
export interface OCRBoxSourceResult {
  source: OCRSourceType;
  tokens: OCRToken[];
}

// 🔹 UNION
export type OCRSourceResult =
  | OCRTextSourceResult
  | OCRBoxSourceResult;

// 🔹 FINAL
export interface OCRMultiResult {
  sources: OCRSourceResult[];
}