import { parserMap } from "../parsers/parserMap";
import { extractTextFromImage } from "../utils/ocr";

export async function processOCR(
  imageUrl: string,
  parserType: string
) {
  const text = await extractTextFromImage(imageUrl);

  console.log("=== OCR TEXT START ===");
  console.log(text);
  console.log("=== OCR TEXT END ===");

  const parser = parserMap[parserType as keyof typeof parserMap];
  if (!parser) return [];

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const parsed = parser(lines);

  console.log("=== PARSED OUTPUT ===");
  console.log(parsed);
  console.log("=====================");

  return parsed;
}