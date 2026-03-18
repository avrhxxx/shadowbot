import { parserMap } from "../parsers/parserMap";
import { extractTextFromImage } from "../utils/ocr";
import { preprocessOCR } from "../utils/preprocessOCR";
import { preprocessImage } from "../utils/imagePreprocess"; // 🔥 NOWE
import fetch from "node-fetch"; // 🔥 NOWE

export async function processOCR(
  imageUrl: string,
  parserType: string
) {
  // 🔥 1. pobierz obraz
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 🔥 2. PRZETWÓRZ obraz (grayscale, threshold itd.)
  const processedBuffer = await preprocessImage(buffer);

  // 🔥 3. OCR na przetworzonym obrazie
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

  // 🔥 PREPROCESS (clean + crop)
  lines = preprocessOCR(lines, parserType as any);

  // 🔥 zostaw tylko linie z punktami (M/K/liczby)
  lines = lines.filter((line) =>
    /[\d]+(\.\d+)?\s*[MK]?$/i.test(line)
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