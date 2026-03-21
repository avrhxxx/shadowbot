// src/quickadd/services/OCRService.ts
import { extractTextFromImage } from "../utils/ocr";
import { preprocessImage, splitIntoRows } from "../utils/imagePreprocess";
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

  // =====================================
  // ✂️ SPLIT NA WIERSZE
  // =====================================
  const rows = await splitIntoRows(buffer);

  const allRawLines: string[] = [];

  // =====================================
  // 🔍 OCR PER ROW (GAME CHANGER)
  // =====================================
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const processedRow = await preprocessImage(row);
    const text = await extractTextFromImage(processedRow);

    console.log(`🧩 ROW [${i}] RAW OCR:`);
    console.log(text);

    const rowLines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    allRawLines.push(...rowLines);
  }

  console.log("📄 TOTAL RAW LINES:", allRawLines.length);

  // =====================================
  // 🧼 CLEANING
  // =====================================
  let lines = preprocessOCR(allRawLines);

  console.log("=== FILTERED LINES ===");
  console.log(lines);
  console.log("======================");

  lines.forEach((line, i) => {
    console.log(`[${i}] "${line}"`);
  });

  return {
    text: allRawLines.join("\n"),
    lines,
  };
}

// =====================================
// 🧼 OCR CLEANER (FIXED - unicode safe)
// =====================================
export function preprocessOCR(lines: string[]): string[] {
  const result: string[] = [];

  for (let line of lines) {
    if (!line) continue;

    let cleaned = line
      .replace(/[ÔÇś@%*_=~`"'|\\]/g, "")
      .replace(/^\d+\s*/, "")
      .replace(/^[^\p{L}\p{N}]+/gu, "")     // 🔥 unicode-safe
      .replace(/[^\p{L}\p{N}]+$/gu, "")     // 🔥 unicode-safe
      .replace(/\b[gG]\b/g, "")
      .replace(/(\d),(\d)/g, "$1$2")
      .replace(/[^\p{L}\p{N}\s]/gu, "")     // 🔥 NAJWAŻNIEJSZY FIX
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