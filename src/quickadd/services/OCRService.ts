import { extractTextFromImage } from "../utils/ocr";
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

  // 🔥 DEBUG – zobacz co parser dostaje
  console.log("=== PARSER INPUT DEBUG ===");
  lines.forEach((line, i) => {
    console.log(`[${i}] "${line}"`);
  });
  console.log("==========================");

  const { type, entries } = parseByImageType(lines);

  console.log("=== PARSED OUTPUT ===");
  console.log(type, entries);
  console.log("=====================");

  return { type, entries };
}

// 🔥 ULEPSZONY PREPROCESS
export function preprocessOCR(lines: string[]): string[] {
  const result: string[] = [];

  for (let line of lines) {
    if (!line) continue;

    let cleaned = line
      // usuń dziwne znaki OCR
      .replace(/[ÔÇś@%*_=~`"'|\\]/g, "")
      
      // usuń numerację (np. "12 Nick")
      .replace(/^\d+\s*/, "")

      // usuń śmieci na początku/końcu
      .replace(/^[^\w]+/, "")
      .replace(/[^\w\d]+$/g, "")

      // 🔥 NOWE: usuń "g" (typowe w donations)
      .replace(/\b[gG]\b/g, "")

      // 🔥 NOWE: usuń przecinki z liczb (38,352 → 38352)
      .replace(/(\d),(\d)/g, "$1$2")

      // 🔥 NOWE: usuń wszystko poza sensownymi znakami
      .replace(/[^\w\s\d]/g, "")

      // normalize spacje
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned) continue;

    const lower = cleaned.toLowerCase();

    // ❌ usuń UI śmieci
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

    // 🔥 DEBUG – pokaż transformację
    console.log(`RAW: "${line}" → CLEAN: "${cleaned}"`);

    result.push(cleaned);
  }

  return result;
}