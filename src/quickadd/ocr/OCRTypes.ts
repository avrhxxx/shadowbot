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
 *
 * 🧠 NOTE:
 * - Supports multiple OCR providers (Vision + Tesseract)
 * - Tokens must be unified across engines
 */

export type OCRToken = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number; // Vision may not provide confidence
};

// =====================================
// 🧱 SOURCE TYPES
// =====================================

export type OCRSourceType =
  | "VISION"
  | "TESSERACT_FULL"
  | "TESSERACT_LINE"
  | "TESSERACT_BOX"
  | "TESSERACT_HOCR";

// =====================================
// 🧱 SOURCE STRUCTURES (STRICT)
// =====================================

export interface OCRTextSource {
  source:
    | "TESSERACT_FULL"
    | "TESSERACT_LINE"
    | "TESSERACT_HOCR";
  text: string;
  lines: string[];
}

export interface OCRTokenSource {
  source:
    | "VISION"
    | "TESSERACT_BOX";
  tokens: OCRToken[];
}

// 🔥 DISCRIMINATED UNION
export type OCRSource = OCRTextSource | OCRTokenSource;

// =====================================
// 📤 FINAL RESULT
// =====================================

export interface OCRResult {
  sources: OCRSource[];
}