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

const log = createLogger("OCR");

// =====================================
// 🧱 TYPES
// =====================================

export type OCRToken = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

// =====================================
// 🔥 ADAPTER
// =====================================

export function mapVisionToTokens(
  result: any,
  traceId: string
): OCRToken[] {
  if (!traceId) {
    throw new Error("traceId is required in VisionOCRAdapter");
  }

  const startedAt = Date.now();

  const fullText = result?.fullTextAnnotation;

  if (!fullText) {
    log.trace("ocr_no_fulltext", traceId, {});
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
            word.symbols?.map((s: any) => s.text).join("") || "";

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
          });
        }
      }
    }
  }

  log.trace("ocr_tokens_extracted", traceId, {
    tokens: tokens.length,
    durationMs: Date.now() - startedAt,
  });

  return tokens;
}