// src/quickadd/ocr/OCRService.ts

import { preprocessImage } from "./OCRPreprocess";
import { runOCR } from "./OCRRunner";
import { mergeOCR } from "./OCRMerge";
import { debug } from "../debug/DebugLogger";

export async function extractTextFromImage(
  buffer: Buffer
): Promise<string> {
  debug("OCR", "START");

  const processed = await preprocessImage(buffer);

  const results = await runOCR(processed);

  const merged = mergeOCR(results);

  debug("OCR", "DONE", merged.length);

  return merged;
}