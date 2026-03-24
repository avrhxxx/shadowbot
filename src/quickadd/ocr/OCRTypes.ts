// =====================================
// 📁 src/quickadd/ocr/OCRTypes.ts
// =====================================

export type OCRSourceType =
  | "TESSERACT_FULL"
  | "TESSERACT_LINE";

export interface OCRSourceResult {
  source: OCRSourceType;
  text: string;
  lines: string[];
}

export interface OCRMultiResult {
  sources: OCRSourceResult[];
}