// =====================================
// 📁 src/quickadd/ocr/OCRService.ts
// =====================================

import { runFullImageOCR } from "./OCRRunner";
import { debug } from "../debug/DebugLogger";

const SCOPE = "OCR";

export async function runOCR(imageUrl: string) {
  debug(SCOPE, "OCR_START", imageUrl);

  const result = await runFullImageOCR(imageUrl);

  debug(SCOPE, "OCR_DONE", result);

  return result;
}