// =====================================
// 📁 src/quickadd/ocr/OCRRunner.ts
// =====================================

import Tesseract from "tesseract.js";
import { createLogger } from "../debug/DebugLogger";

const log = createLogger("OCR");

export async function runFullImage(buffer: Buffer, traceId: string) {
  log.trace("run_full_start", traceId);

  const result = await Tesseract.recognize(buffer, "eng", {
    logger: () => {},
  });

  const text = result.data.text || "";

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  log.trace("run_full_result", traceId, {
    length: text.length,
    lines: lines.length,
  });

  return { text, lines };
}

export async function runLineBased(_buffer: Buffer) {
  return { text: "", lines: [] };
}

export async function runBlockBased(_buffer: Buffer) {
  return { text: "", lines: [] };
}