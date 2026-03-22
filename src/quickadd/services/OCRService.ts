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

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  console.log("📸 IMAGE SIZE:", buffer.length);

  const processedBuffer = await preprocessImage(buffer);
  const text = await extractTextFromImage(processedBuffer);

  console.log("🧠 OCR LENGTH:", text.length);

  if (!text || text.trim().length < 5) {
    console.log("⚠️ OCR FAILED HARD - returning empty result");
    return { text: "", lines: [] };
  }

  let lines = text
    .split("\n")
    .map((l) => unicodeCleaner(l))
    .map((l) => l.trim())
    .filter(Boolean);

  lines = preprocessOCR(lines);
  lines = mergeBrokenLines(lines);
  lines = normalizeLines(lines);

  if (lines.length > 100) {
    lines = lines.slice(0, 100);
  }

  console.log("=== FINAL LINES ===");
  lines.forEach((line, i) => {
    console.log(`[${i}] "${line}"`);
  });

  return { text, lines };
}

// =====================================
// CLEAN
// =====================================
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

// =====================================
// 🔥 MERGE (FIXED)
// =====================================
function mergeBrokenLines(lines: string[]): string[] {
  const merged: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let current = lines[i];
    const next = lines[i + 1];

    if (!next) {
      merged.push(current);
      continue;
    }

    // 41 + 999
    if (/^\d{2,}$/.test(current) && /^\d{2,3}$/.test(next)) {
      merged.push(current + next);
      i++;
      continue;
    }

    // 🔥 41 + ,999
    if (/^\d{2,}$/.test(current) && /^,\d{3}$/.test(next)) {
      merged.push(current + next.replace(",", ""));
      i++;
      continue;
    }

    // 🔥 Donations: 41 + ,999
    if (/donat/i.test(current) && /^,\d{3}$/.test(next)) {
      merged.push(current + next);
      i++;
      continue;
    }

    merged.push(current);
  }

  return merged;
}

// =====================================
// 🔥 NORMALIZE (FIXED)
// =====================================
function normalizeLines(lines: string[]): string[] {
  return lines.map((line) =>
    line
      .replace(/(\d)\s+(\d{3})/g, "$1$2")
      .replace(/,\s*(\d{3})/g, ",$1")
      .replace(/\s+/g, " ")
      .trim()
  );
}