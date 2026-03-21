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

  console.log("=== OCR TEXT START ===");
  console.log(text);
  console.log("=== OCR TEXT END ===");

  let lines = text
    .split("\n")
    .map((l) => unicodeCleaner(l))
    .map((l) => l.trim())
    .filter(Boolean);

  lines = preprocessOCR(lines);
  lines = mergeBrokenLines(lines); // 🔥 NOWE

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
      .replace(/[ÔÇś@%*_=~`"'|\\]/g, "")
      .replace(/^\d+\s*/, "")
      .replace(/^[^\w]+/, "")
      .replace(/[^\w\d]+$/g, "")
      .replace(/(\d),(\d)/g, "$1$2")
      .replace(/[^\w\s\d]/g, "")
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

// 🔥 KLUCZOWE — naprawia split nicków i wartości
function mergeBrokenLines(lines: string[]): string[] {
  const merged: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let current = lines[i];
    const next = lines[i + 1];

    if (!next) {
      merged.push(current);
      continue;
    }

    // 🔥 przypadek: nick rozbity na 2 linie
    if (
      current.length <= 6 &&
      next.length <= 6 &&
      /^[a-z0-9]+$/i.test(current) &&
      /^[a-z0-9]+$/i.test(next)
    ) {
      merged.push(current + next);
      i++;
      continue;
    }

    // 🔥 przypadek: liczba rozbita (np. 43 + 000)
    if (/^\d{2,}$/.test(current) && /^\d{2,}$/.test(next)) {
      merged.push(current + next);
      i++;
      continue;
    }

    merged.push(current);
  }

  return merged;
}