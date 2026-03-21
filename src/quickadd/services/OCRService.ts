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

  let lines = text
    .split("\n")
    .map((l) => unicodeCleaner(l))
    .map((l) => l.trim())
    .filter(Boolean);

  lines = preprocessOCR(lines);
  lines = mergeBrokenLines(lines);
  lines = normalizeLines(lines);

  console.log("=== FINAL LINES ===");
  lines.forEach((line, i) => {
    console.log(`[${i}] "${line}"`);
  });

  return { text, lines };
}

// 🔥 CLEAN (mniej agresywny)
function preprocessOCR(lines: string[]): string[] {
  const result: string[] = [];

  for (let line of lines) {
    if (!line) continue;

    let cleaned = line
      .replace(/[ÔÇś@%*=~`"'\\]/g, "")
      .replace(/^\d+\s*/, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned) continue;

    const lower = cleaned.toLowerCase();

    if (
      lower.includes("tap to") ||
      lower.includes("share") ||
      lower.includes("copy") ||
      lower === "ok"
    ) continue;

    result.push(cleaned);
  }

  return result;
}

// 🔥 MERGE — MNIEJ AGRESYWNY
function mergeBrokenLines(lines: string[]): string[] {
  const merged: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const current = lines[i];
    const next = lines[i + 1];

    if (!next) {
      merged.push(current);
      continue;
    }

    // tylko liczby
    if (/^\d{2,}$/.test(current) && /^\d{2,3}$/.test(next)) {
      merged.push(current + next);
      i++;
      continue;
    }

    merged.push(current);
  }

  return merged;
}

// 🔥 NORMALIZE
function normalizeLines(lines: string[]): string[] {
  return lines.map((line) =>
    line
      .replace(/(\d)\s+(\d{3})/g, "$1$2")
      .replace(/\s+/g, " ")
      .trim()
  );
}