// =====================================
// 📁 src/quickadd/ocr/OCRRunner.ts
// =====================================

import { debug } from "../debug/DebugLogger";

const SCOPE = "OCR";

export async function runFullImageOCR(imageUrl: string) {
  debug(SCOPE, "RUN_FULL_START", imageUrl);

  const result = {
    text: "Sample OCR text",
    lines: ["Sample", "OCR", "text"],
  };

  debug(SCOPE, "RUN_FULL_RESULT", result);

  return result;
}