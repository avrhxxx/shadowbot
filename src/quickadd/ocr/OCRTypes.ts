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
  confidence?: number; // 🔥 OPTIONAL (Vision doesn't provide this)
};

// =====================================
// 🧱 SOURCE TYPES
// =====================================

export type OCRSourceType =
  | "VISION" // 🔥 NEW (primary OCR)
  | "TESSERACT_FULL"
  | "TESSERACT_LINE"
  | "TESSERACT_BOX"
  | "TESSERACT_HOCR";

// =====================================
// 🧱 SOURCE STRUCTURES
// =====================================

export interface OCRTextSource {
  source: OCRSourceType;
  text: string;
  lines: string[];
}

export interface OCRTokenSource {
  source: OCRSourceType; // 🔥 NOT limited anymore
  tokens: OCRToken[];
}

export type OCRSource = OCRTextSource | OCRTokenSource;

// =====================================
// 📤 FINAL RESULT
// =====================================

export interface OCRResult {
  sources: OCRSource[];
}