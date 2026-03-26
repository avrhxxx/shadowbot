// =====================================
// 📁 src/quickadd/ocr/OCRMerger.ts
// =====================================

/**
 * 🔗 ROLE:
 * (DEPRECATED / RESERVED)
 *
 * Previously used for merging OCR text outputs.
 *
 * ⚠️ CURRENT ARCHITECTURE:
 * - NO text merging is used
 * - Each OCR source is processed independently
 * - Selection happens AFTER parsing (pipeline level)
 *
 * This file is kept for potential future use.
 */

export function mergeOCRTexts(texts: string[]): string {
  return texts.join("\n");
}