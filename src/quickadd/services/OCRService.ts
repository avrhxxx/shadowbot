// src/quickadd/services/OCRService.ts

import { extractTextFromImage } from "../utils/ocr";
import { preprocessOCR } from "../utils/preprocessOCR";
import { preprocessImage } from "../utils/imagePreprocess";
import { parseByImageType } from "../parsers/ParserManager";
import fetch from "node-fetch";

export async function processOCR(imageUrl: string) {
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const processedBuffer = await preprocessImage(buffer);

  const text = await extractTextFromImage(processedBuffer);

  console.log("=== OCR TEXT START ===");
  console.log(text);
  console.log("=== OCR TEXT END ===");

  let lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  lines = preprocessOCR(lines);

  console.log("=== FILTERED LINES ===");
  console.log(lines);
  console.log("======================");

  // 🔥 KLUCZOWE
  const { type, entries } = parseByImageType(lines);

  console.log("=== PARSED OUTPUT ===");
  console.log(type, entries);
  console.log("=====================");

  return { type, entries };
}