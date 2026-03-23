// =====================================
// 📁 src/quickadd/ocr/OCRRunner.ts
// =====================================

import Tesseract from "tesseract.js";
import { createLogger } from "../debug/DebugLogger";

const log = createLogger("OCR");

export async function runFullImage(buffer: Buffer) {
  log("run_full_start");

  const result = await Tesseract.recognize(buffer, "eng", {
    logger: () => {},
  });

  const text = result.data.text || "";

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const output = { text, lines };

  log("run_full_result", {
    length: text.length,
    lines: lines.length,
  });

  return output;
}

export async function runLineBased(_buffer: Buffer) {
  log.warn("run_line_based_not_implemented");

  return { text: "", lines: [] };
}

export async function runBlockBased(_buffer: Buffer) {
  log.warn("run_block_based_not_implemented");

  return { text: "", lines: [] };
}