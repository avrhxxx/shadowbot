// =====================================
// 📁 src/system/quickadd/core/QuickAddPipeline.ts
// =====================================

/**
 * 🧠 ROLE:
 * Main processing pipeline for QuickAdd OCR input.
 *
 * Responsible for:
 * - OCR → layout → parsing → validation
 * - selecting best OCR source
 * - pushing entries into buffer
 *
 * ❗ RULES:
 * - NO ID generation (traceId is injected)
 * - NO session mutations
 * - NO business branching outside pipeline scope
 * - FULL observability via logger.emit
 *
 * 🔥 FLOW:
 * 1. Context validation
 * 2. OCR (multi-source)
 * 3. Layout building
 * 4. Parsing (type-based)
 * 5. Validation
 * 6. Best result selection (highest valid count)
 * 7. Buffer write
 *
 * ✅ NOTES:
 * - soft-fail per OCR source (never breaks whole pipeline)
 * - deterministic selection strategy
 * - metrics & timing embedded in logs
 */

import { Message } from "discord.js";
import { logger } from "../../../core/logger/log";

import { runOCR } from "../ocr/OCRProcessor";
import { parseByType } from "../parsing/ParserRouter";
import { validateEntries } from "../validation/QuickAddValidator";
import { QuickAddBuffer } from "../storage/QuickAddBuffer";
import { buildLayout } from "../ocr/layout/LayoutBuilder";

import { QuickAddSession } from "./QuickAddSession";
import { ParsedEntry, ValidatedEntry } from "./QuickAddTypes";

// =====================================
// 🚀 MAIN PIPELINE
// =====================================

export async function processImageInput(
  message: Message,
  session: ReturnType<typeof QuickAddSession.get>,
  imageUrl: string,
  traceId: string
) {
  const startTime = Date.now();

  const guildId = message.guild?.id;
  const userId = message.author?.id;

  // =====================================
  // 🔍 CONTEXT CHECK
  // =====================================

  logger.emit({
    event: "pipeline_context_check",
    traceId,
    data: {
      sessionId: session?.sessionId,
      guildId,
      userId,
    },
  });

  if (!guildId || !session) {
    logger.emit({
      event: "pipeline_invalid_context",
      traceId,
      level: "warn",
      data: {
        guildId,
        userId,
      },
    });

    return;
  }

  try {
    logger.emit({
      event: "pipeline_start",
      traceId,
      data: {
        sessionId: session.sessionId,
        type: session.type,
      },
    });

    // =====================================
    // 📥 OCR
    // =====================================

    const ocrResult = await runOCR(imageUrl, traceId);

    if (!ocrResult.sources.length) {
      logger.emit({
        event: "pipeline_ocr_empty",
        traceId,
        level: "warn",
      });

      return;
    }

    // =====================================
    // 🔄 PROCESS SOURCES
    // =====================================

    const results: {
      source: string;
      entries: ValidatedEntry[];
      validCount: number;
    }[] = [];

    for (const source of ocrResult.sources) {
      try {
        if (!("tokens" in source) || !source.tokens?.length) continue;

        // =====================================
        // 🧱 LAYOUT
        // =====================================
        const layout = buildLayout(source.tokens, traceId);
        if (!layout.length) continue;

        // =====================================
        // 🧠 PARSE
        // =====================================
        const parsed: ParsedEntry[] = parseByType(
          session.type,
          { layout },
          traceId
        );

        if (!parsed.length) continue;

        // =====================================
        // ✅ VALIDATE
        // =====================================
        const validated = await validateEntries(
          parsed.map((p) => ({
            nickname: p.nickname,
            value: p.value,
          })),
          traceId
        );

        results.push({
          source: source.source,
          entries: validated,
          validCount: validated.filter((v) => v.status === "OK").length,
        });

      } catch (err) {
        logger.emit({
          event: "pipeline_source_error",
          traceId,
          level: "warn",
          data: {
            source: source?.source,
            error: err,
          },
        });
      }
    }

    // =====================================
    // ❌ NO RESULTS
    // =====================================

    if (!results.length) {
      logger.emit({
        event: "pipeline_no_results",
        traceId,
        level: "warn",
      });

      return;
    }

    // =====================================
    // 🏆 BEST SOURCE SELECTION
    // =====================================

    const best = results.sort(
      (a, b) => b.validCount - a.validCount
    )[0];

    // =====================================
    // 💾 BUFFER WRITE
    // =====================================

    QuickAddBuffer.addEntries(
      guildId,
      best.entries.map((v) => ({
        nickname: v.nickname,
        value: v.value,
        status: v.status,
        confidence: v.confidence,
        suggestion: v.suggestion,
        source: best.source,
      })),
      traceId
    );

    const duration = Date.now() - startTime;

    // =====================================
    // ✅ DONE
    // =====================================

    logger.emit({
      event: "pipeline_done",
      traceId,
      data: {
        sessionId: session.sessionId,
        total: best.entries.length,
        valid: best.validCount,
        durationMs: duration,
      },
    });

  } catch (err) {
    logger.emit({
      event: "pipeline_error",
      traceId,
      level: "error",
      data: {
        error: err,
      },
    });
  }
}