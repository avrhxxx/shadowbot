// =====================================
// 📁 src/quickadd/ocr/VisionOCRAdapter.ts
// =====================================

/**
 * 🧠 ROLE:
 * Adapter that transforms Google Vision OCR response
 * into QuickAdd OCRToken format.
 *
 * Responsibilities:
 * - extract words from Vision response
 * - map bounding boxes → tokens
 *
 * ❗ RULES:
 * - NO business logic
 * - NO validation
 * - NO filtering
 * - deterministic
 */

import { createLogger } from "../debug/DebugLogger";
import { OCRToken } from "./OCRTypes";

const log = createLogger("OCR_VISION");

// =====================================
// 🧱 TYPES (MINIMAL SAFE SHAPE)
// =====================================

type VisionSymbol = {
  text: string;
};

type VisionWord = {
  symbols?: VisionSymbol[];
  boundingBox?: {
    vertices?: { x?: number; y?: number }[];
  };
};

type VisionParagraph = {
  words?: VisionWord[];
};

type VisionBlock = {
  paragraphs?: VisionParagraph[];
};

type VisionPage = {
  blocks?: VisionBlock[];
};

type VisionResult = {
  fullTextAnnotation?: {
    pages?: VisionPage[];
  };
};

// =====================================
// 🔥 ADAPTER
// =====================================

export function mapVisionToTokens(
  result: VisionResult,
  traceId: string
): OCRToken[] {
  if (!traceId) {
    throw new Error("traceId is required in VisionOCRAdapter");
  }

  const startedAt = Date.now();

  const fullText = result?.fullTextAnnotation;

  if (!fullText) {
    log.trace("vision_no_fulltext", traceId, {});
    return [];
  }

  const tokens: OCRToken[] = [];

  // =====================================
  // 🧠 PARSE WORDS
  // =====================================
  for (const page of fullText.pages || []) {
    for (const block of page.blocks || []) {
      for (const paragraph of block.paragraphs || []) {
        for (const word of paragraph.words || []) {
          const text =
            word.symbols?.map((s) => s.text).join("") || "";

          if (!text) continue;

          const vertices = word.boundingBox?.vertices;

          if (!vertices || vertices.length < 4) continue;

          const x = vertices[0].x || 0;
          const y = vertices[0].y || 0;

          const width = (vertices[1].x || 0) - x;
          const height = (vertices[2].y || 0) - y;

          tokens.push({
            text,
            x,
            y,
            width,
            height,
            confidence: undefined, // Vision does not provide confidence
          });
        }
      }
    }
  }

  log.trace("vision_tokens_extracted", traceId, {
    tokens: tokens.length,
    durationMs: Date.now() - startedAt,
  });

  return tokens;
}