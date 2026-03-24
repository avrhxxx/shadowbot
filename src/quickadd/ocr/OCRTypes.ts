// =====================================
// 📁 src/quickadd/ocr/OCRTypes.ts
// =====================================

/**
 * 📦 ROLE:
 * Contract definitions for OCR layer.
 *
 * Used by:
 * - OCRProcessor
 * - OCREngine
 * - LayoutBuilder
 */

export type OCRToken = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
};

export type OCRSourceType =
  | "TESSERACT_FULL"
  | "TESSERACT_LINE"
  | "TESSERACT_BOX"
  | "TESSERACT_HOCR";

export interface OCRTextSource {
  source: OCRSourceType;
  text: string;
  lines: string[];
}

export interface OCRTokenSource {
  source: "TESSERACT_BOX";
  tokens: OCRToken[];
}

export type OCRSource = OCRTextSource | OCRTokenSource;

export interface OCRResult {
  sources: OCRSource[];
}