// =====================================
// 📁 src/quickadd/ocr/OCRMerger.ts
// =====================================

/**
 * 🔗 ROLE:
 * Merge OCR outputs (if needed in future).
 *
 * Currently simple helper.
 */

export function mergeOCRTexts(texts: string[]): string {
  return texts.join("\n");
}