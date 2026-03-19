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

  // 🔥 preprocess linii (clean + crop)
  lines = preprocessOCR(lines, parserType as any);

  // =====================================================
  // 🔥 SMART FILTER (różny dla każdego parsera)
  // =====================================================

  if (parserType === "DUEL_POINTS") {
    // tylko linie z punktami typu 36.59M / 1200K
    lines = lines.filter((line) =>
      /[\d]+\.\d+\s*[MK]$/i.test(line) ||
      /[\d]{3,}\s*[MK]$/i.test(line)
    );
  }

  if (parserType === "DONATIONS") {
    // 🔥 zostaw:
    // - linie z Donations
    // - linie wyglądające jak nicki
    lines = lines.filter((line) => {
      const lower = line.toLowerCase();

      return (
        lower.includes("donations") ||
        /^[a-zA-Z0-9_\s.'-]{3,}$/.test(line)
      );
    });
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