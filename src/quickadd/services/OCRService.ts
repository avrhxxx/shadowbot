import { extractTextFromImage } from "../utils/ocr";
import { preprocessImage } from "../utils/imagePreprocess";
import fetch from "node-fetch";

// 🔥 OCR RESULT (CZYSTY – BEZ PARSOWANIA)
export interface OCRResult {
  text: string;
  lines: string[];
}

export async function processOCR(imageUrl: string): Promise<OCRResult> {
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 🧠 preprocess obrazu
  const processedBuffer = await preprocessImage(buffer);

  // 🔤 OCR
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

  // 🔥 DEBUG
  console.log("=== OCR FINAL INPUT ===");
  lines.forEach((line, i) => {
    console.log(`[${i}] "${line}"`);
  });
  console.log("========================");

  return { text, lines };
}

// =====================================
// 🔥 PREPROCESS LINES
// =====================================
export function preprocessOCR(lines: string[]): string[] {
  const result: string[] = [];

  for (let line of lines) {
    if (!line) continue;

    let cleaned = line
      // usuń śmieci OCR
      .replace(/[ÔÇś@%*_=~`"'|\\]/g, "")

      // usuń numerację (np. "12 Nick")
      .replace(/^\d+\s*/, "")

      // usuń śmieci na początku/końcu
      .replace(/^[^\w]+/, "")
      .replace(/[^\w\d]+$/g, "")

      // 🔥 usuń "g" (donations bug)
      .replace(/\b[gG]\b/g, "")

      // 🔥 usuń przecinki z liczb
      .replace(/(\d),(\d)/g, "$1$2")

      // 🔥 zostaw tylko sensowne znaki
      .replace(/[^\w\s\d]/g, "")

      // normalize spacje
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned) continue;

    const lower = cleaned.toLowerCase();

    // ❌ UI śmieci
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