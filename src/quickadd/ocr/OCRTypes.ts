// =====================================
// 📁 src/quickadd/ocr/OCRTypes.ts
// =====================================

import { OCRToken } from "./OCRRunner";

export type OCRSourceType =
  | "TESSERACT_FULL"
  | "TESSERACT_LINE"
  | "TESSERACT_BOX"
  | "TESSERACT_HOCR"
  | "OCRSPACE_FULL"
  | "OCRSPACE_LINE";

export interface OCRTextSourceResult {
  source:
    | "TESSERACT_FULL"
    | "TESSERACT_LINE"
    | "OCRSPACE_FULL"
    | "OCRSPACE_LINE"
    | "TESSERACT_HOCR";
  text: string;
  lines: string[];
}

export interface OCRBoxSourceResult {
  source: "TESSERACT_BOX";
  tokens: OCRToken[];
}

export type OCRSourceResult =
  | OCRTextSourceResult
  | OCRBoxSourceResult;

export interface OCRMultiResult {
  sources: OCRSourceResult[];
}