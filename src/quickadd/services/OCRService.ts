import { parserMap } from "../parsers/parserMap";
import { extractTextFromImage } from "../utils/ocr";
import { preprocessOCR } from "../utils/preprocessOCR";
import { preprocessImage } from "../utils/imagePreprocess";
import fetch from "node-fetch";

export async function processOCR(
  imageUrl: string,
  parserType: string
) {
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const processedBuffer = await preprocessImage(buffer);

  const text = await extractTextFromImage(processedBuffer);

  console.log("=== OCR TEXT START ===");
  console.log(text);
  console.log("=== OCR TEXT END ===");

  const parser = parserMap[parserType as keyof typeof parserMap];
  if (!parser) return [];

  let lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // 🔥 MAIN FIX
  lines = preprocessOCR(lines, parserType as any);

  if (parserType === "DUEL_POINTS") {
    lines = lines.filter((line) =>
      /[\d]+\.\d+\s*[MK]$/i.test(line) ||
      /[\d]{3,}\s*[MK]$/i.test(line)
    );
  }

  console.log("=== FILTERED LINES ===");
  console.log(lines);
  console.log("======================");

  const parsed = parser(lines);

  console.log("=== PARSED OUTPUT ===");
  console.log(parsed);
  console.log("=====================");

  return parsed;
}