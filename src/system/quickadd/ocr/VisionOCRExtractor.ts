// =====================================
// 📁 src/quickadd/ocr/VisionOCRExtractor.ts
// =====================================

import { log } from "../../core/logger/log";
import { OCRToken } from "./OCRTypes";
import { TraceContext } from "../../core/trace/TraceContext";

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
  ctx: TraceContext
): OCRToken[] {
  const l = log.ctx(ctx);
  const startedAt = Date.now();

  const fullText = result?.fullTextAnnotation;

  if (!fullText) {
    l.warn("vision_no_fulltext");
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

  l.event("vision_tokens_extracted", {
    tokens: tokens.length,
  }, {
    durationMs: Date.now() - startedAt,
  });

  return tokens;
}