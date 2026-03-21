// src/quickadd/services/OCRService.ts
import { extractTextFromImage } from "../utils/ocr";
import { preprocessImage } from "../utils/imagePreprocess";
import fetch from "node-fetch";

export interface OCRResult {
  text: string;
  lines: string[];
}

export async function processOCR(imageUrl: string): Promise<OCRResult> {
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  console.log("📸 IMAGE SIZE:", buffer.length);

  const processedBuffer = await preprocessImage(buffer);

  const text = await extractTextFromImage(processedBuffer);

  console.log("📄 OCR RAW LENGTH:", text.length);

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

  lines.forEach((line, i) => {
    console.log(`[${i}] "${line}"`);
  });

  return { text, lines };
}

// =====================================
export function preprocessOCR(lines: string[]): string[] {
  const result: string[] = [];

  for (let line of lines) {
    if (!line) continue;

    let cleaned = line
      .replace(/[ÔÇś@%*_=~`"'|\\]/g, "")
      .replace(/^\d+\s*/, "")
      .replace(/^[^\w]+/, "")
      .replace(/[^\w\d]+$/g, "")
      .replace(/\b[gG]\b/g, "")
      .replace(/(\d),(\d)/g, "$1$2")
      .replace(/[^\w\s\d]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned) continue;

    const lower = cleaned.toLowerCase();

    if (
      lower.includes("at least") ||
      lower.includes("required") ||
      lower.includes("total") ||
      lower.includes("ranking") ||
      lower.includes("alliance") ||
      lower.includes("points") ||
      lower.includes("contribution") ||
      lower.includes("reward")
    ) {
      continue;
    }

    console.log(`RAW: "${line}" → CLEAN: "${cleaned}"`);

    result.push(cleaned);
  }

  return result;
}