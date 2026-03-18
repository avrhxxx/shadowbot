import { parserMap } from "../parsers/parserMap";
import { extractTextFromImage } from "../utils/ocr";
import { preprocessOCR } from "../utils/preprocessOCR"; // ✅ POPRAWIONA ŚCIEŻKA

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

  let lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // 🔥 PREPROCESS (usuwanie śmieci + dolnego usera)
  lines = preprocessOCR(
    lines,
    parserType as keyof typeof parserMap // ✅ lepsze typowanie niż any
  );

  console.log("=== PREPROCESSED LINES ===");
  console.log(lines);
  console.log("==========================");

  const parsed = parser(lines);

  console.log("=== PARSED OUTPUT ===");
  console.log(parsed);
  console.log("=====================");

  return parsed;
}