// src/quickadd/services/OCRService.ts
import { extractTextFromImage } from "../utils/ocr";
import { preprocessImage } from "../utils/imagePreprocess";
import { unicodeCleaner } from "../utils/unicodeCleaner";
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

  const processedBuffer = await preprocessImage(buffer);

  const text = await extractTextFromImage(processedBuffer);

  console.log("📄 OCR RAW LENGTH:", text.length);

  // 🔥 NAJWAŻNIEJSZY DEBUG
  console.log("🧪 RAW OCR START");
  console.log(text);
  console.log("🧪 RAW OCR END");

  let lines = text
    .split("\n")
    .map((l) => unicodeCleaner(l))
    .map((l) => l.trim())
    .filter(Boolean);

  lines = preprocessOCR(lines);
  lines = mergeBrokenLines(lines);

  console.log("=== FINAL LINES ===");
  console.log(lines);

  lines.forEach((line, i) => {
    console.log(`[${i}] "${line}"`);
  });

  return { text, lines };
}

// =====================================

export function preprocessOCR(lines: string[]): string[] {
  const result: string[] = [];

  for (let line of lines) {
    if (!line) continue;

    let cleaned = line
      .replace(/[ÔÇś@%*_=~`"'\\]/g, "") // 🔥 NIE usuwamy _ | -
      .replace(/^\d+\s*/, "")
      .replace(/^[^\p{L}\p{N}]+/gu, "")
      .replace(/[^\p{L}\p{N}_|\s-]+$/gu, "") // 🔥 zachowujemy sensowne znaki
      .replace(/(\d),(\d)/g, "$1$2")
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
      lower.includes("contribution") ||
      lower.includes("reward")
    ) {
      continue;
    }

    result.push(cleaned);
  }

  return result;
}

// =====================================
// 🔥 SMART MERGE (DUŻO BEZPIECZNIEJSZY)
// =====================================
function mergeBrokenLines(lines: string[]): string[] {
  const merged: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const current = lines[i];
    const next = lines[i + 1];

    if (!next) {
      merged.push(current);
      continue;
    }

    // 🔥 VERY SHORT OCR SPLIT (np. "xX" + "Dark")
    if (
      current.length <= 3 &&
      next.length <= 6 &&
      /^[a-z0-9]+$/i.test(current) &&
      /^[a-z0-9]+$/i.test(next)
    ) {
      merged.push(current + next);
      i++;
      continue;
    }

    // 🔥 liczba split (bezpieczne)
    if (/^\d{2,}$/.test(current) && /^\d{2,3}$/.test(next)) {
      merged.push(current + next);
      i++;
      continue;
    }

    merged.push(current);
  }

  return merged;
}