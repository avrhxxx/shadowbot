
// =====================================
// 📁 src/quickadd/ocr/OCRTypes.ts
// =====================================

export type OCRToken = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
};

export type OCRSourceType =
  | "VISION"
  | "TESSERACT_FULL"
  | "TESSERACT_LINE"
  | "TESSERACT_BOX"
  | "TESSERACT_HOCR";

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

export type OCRSource = OCRTextSource | OCRTokenSource;

export interface OCRResult {
  sources: OCRSource[];
}