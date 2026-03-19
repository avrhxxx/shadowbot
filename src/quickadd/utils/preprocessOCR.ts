import { parserMap } from "../parsers/parserMap";
import { extractTextFromImage } from "../utils/ocr";
import { preprocessOCR } from "../utils/preprocessOCR";
import { preprocessImage } from "../utils/imagePreprocess";
import { detectParserType } from "../utils/detectParserType";
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

  // =========================
  // 🧠 DETECT PARSER TYPE
  // =========================
  const parserType = detectParserType(lines);

  console.log("=== DETECTED TYPE ===");
  console.log(parserType);
  console.log("=====================");

  if (parserType === "UNKNOWN") {
    console.log("❌ Unknown screenshot type – skipping parsing");
    return [];
  }

  // =========================
  // 🔧 PREPROCESS
  // =========================
  lines = preprocessOCR(lines, parserType as any);

  console.log("=== FILTERED LINES ===");
  console.log(lines);
  console.log("======================");

  // =========================
  // 🧠 PARSER
  // =========================
  const parser = parserMap[parserType];
  if (!parser) {
    console.log("❌ No parser found");
    return [];
  }

  const parsed = parser(lines);

  console.log("=== PARSED OUTPUT ===");
  console.log(parsed);
  console.log("=====================");

  return parsed;
}