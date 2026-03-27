// =====================================
// 📁 src/quickadd/ocr/VisionOCRExtractor.ts
// =====================================

import { log } from "../logger";
import { OCRToken } from "./OCRTypes";

type VisionSymbol = { text: string };

type VisionWord = {
  symbols?: VisionSymbol[];
  boundingBox?: {
    vertices?: { x?: number; y?: number }[];
  };
};

type VisionParagraph = { words?: VisionWord[] };
type VisionBlock = { paragraphs?: VisionParagraph[] };
type VisionPage = { blocks?: VisionBlock[] };
type VisionFullText = { pages?: VisionPage[] };

type VisionResponse = {
  fullTextAnnotation?: VisionFullText;
};

export function mapVisionToTokens(
  result: VisionResponse | null,
  traceId: string
): OCRToken[] {
  if (!traceId) {
    throw new Error("traceId is required in VisionOCRExtractor");
  }

  const startedAt = Date.now();

  const fullText = result?.fullTextAnnotation;

  if (!fullText) {
    log.emit({
      event: "vision_no_fulltext",
      traceId,
      type: "system",
    });
    return [];
  }

  const tokens: OCRToken[] = [];

  for (const page of fullText.pages ?? []) {
    for (const block of page.blocks ?? []) {
      for (const paragraph of block.paragraphs ?? []) {
        for (const word of paragraph.words ?? []) {
          const text =
            word.symbols?.map((s) => s.text).join("") ?? "";

          if (!text) continue;

          const vertices = word.boundingBox?.vertices;
          if (!vertices || vertices.length < 4) continue;

          const x = vertices[0]?.x ?? 0;
          const y = vertices[0]?.y ?? 0;

          const width = (vertices[1]?.x ?? x) - x;
          const height = (vertices[2]?.y ?? y) - y;

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

  log.emit({
    event: "vision_tokens_extracted",
    traceId,
    type: "system",
    data: {
      tokens: tokens.length,
      durationMs: Date.now() - startedAt,
    },
  });

  return tokens;
}