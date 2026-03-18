import { parserMap } from "../parsers/parserMap";
import { extractTextFromImage } from "../utils/ocr";
import { preprocessOCR } from "../utils/preprocessOCR";
import { preprocessImage } from "../utils/imagePreprocess";
import fetch from "node-fetch";

export async function processOCR(
  imageUrl: string,
  parserType: string
) {
  // 🔥 pobierz obraz
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 🔥 preprocess obrazu (sharp)
  const processedBuffer = await preprocessImage(buffer);

  // 🔥 OCR
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

  // 🔥 preprocess linii
  lines = preprocessOCR(lines, parserType as any);

  // 🔥 LEPSZY FILTER (tylko sensowne linie z punktami)
  lines = lines.filter((line) =>
    /[\d]+\.\d+\s*[MK]$/i.test(line) ||   // np. 36.59M
    /[\d]{3,}\s*[MK]$/i.test(line)       // np. 1200K
  );

  console.log("=== FILTERED LINES ===");
  console.log(lines);
  console.log("======================");

  const parsed = parser(lines);

  console.log("=== PARSED OUTPUT ===");
  console.log(parsed);
  console.log("=====================");

  return parsed;
}