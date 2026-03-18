import { parserMap } from "../parsers/parserMap";
import { extractTextFromImage } from "../utils/ocr";
import { preprocessOCR } from "../utils/preprocessOCR";
import { ParserType } from "../session/SessionManager";

export async function processOCR(
  imageUrl: string,
  parserType: ParserType
) {
  const text = await extractTextFromImage(imageUrl);

  console.log("=== OCR TEXT START ===");
  console.log(text);
  console.log("=== OCR TEXT END ===");

  const parser = parserMap[parserType];
  if (!parser) return [];

  let lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // 🔥 NOWY KROK
  lines = preprocessOCR(lines, parserType);

  const parsed = parser(lines);

  console.log("=== PARSED OUTPUT ===");
  console.log(parsed);
  console.log("=====================");

  return parsed;
}