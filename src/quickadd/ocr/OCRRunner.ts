// src/quickadd/ocr/OCRRunner.ts

import Tesseract from "tesseract.js";
import { debug } from "../debug/DebugLogger";

const SCOPE = "OCR";

// =============================
// 🟢 FULL IMAGE OCR (AKTYWNE)
// =============================
export async function runFullImage(buffer: Buffer) {
  debug(SCOPE, "RUN_FULL_START");

  const result = await Tesseract.recognize(buffer, "eng", {
    logger: () => {}, // można odkomentować do debugowania
  });

  const text = result.data.text || "";

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const output = { text, lines };

  debug(SCOPE, "RUN_FULL_RESULT", output);

  return output;
}

// =============================
// 🔜 LINE-BASED OCR (PRZYSZŁOŚĆ)
// =============================
export async function runLineBased(_buffer: Buffer) {
  debug(SCOPE, "RUN_LINE_BASED_NOT_IMPLEMENTED");

  return { text: "", lines: [] };
}

// =============================
// 🔜 BLOCK OCR (PRZYSZŁOŚĆ)
// =============================
export async function runBlockBased(_buffer: Buffer) {
  debug(SCOPE, "RUN_BLOCK_BASED_NOT_IMPLEMENTED");

  return { text: "", lines: [] };
}