// =====================================
// 📁 src/system/quickadd/core/QuickAddPipeline.ts
// =====================================

import { Message } from "discord.js";
import { logger } from "../../../core/logger/log";

import { runOCR } from "../ocr/OCRProcessor";
import { parseByType } from "../parsing/ParserRouter";
import { validateEntries } from "../validation/QuickAddValidator";
import { QuickAddBuffer } from "../storage/QuickAddBuffer";
import { buildLayout } from "../ocr/layout/LayoutBuilder";

import { QuickAddSession } from "./QuickAddSession";
import { ParsedEntry, ValidatedEntry } from "./QuickAddTypes";

/**
 * 🧠 ROLE:
 * Main processing pipeline for QuickAdd OCR input.
 *
 * Responsible for:
 * - OCR → parsing → validation → selection
 * - pushing entries into buffer
 *
 * ❗ RULES:
 * - NO ID generation
 * - MUST use provided traceId
 * - FULL observability (logger only - metrics/timing via payload)
 */

export async function processImageInput(
  message: Message,
  session: ReturnType<typeof QuickAddSession.get>,
  imageUrl: string,
  traceId: string
) {
  const startTime = Date.now();

  const guildId = message.guild?.id;
  const userId = message.author?.id;

  logger.emit({
    scope: "quickadd.pipeline",
    event: "context_check",
    traceId,
    context: {
      sessionId: session?.sessionId,
      guildId,
      userId,
    },
  });

  if (!guildId || !session) {
    logger.emit({
      scope: "quickadd.pipeline",
      event: "invalid_context",
      traceId,
      level: "warn",
      context: { guildId, userId },
      metrics: { increment: "pipeline_invalid_context" },
    });

    return;
  }

  try {
    logger.emit({
      scope: "quickadd.pipeline",
      event: "start",
      traceId,
      context: {
        sessionId: session.sessionId,
        type: session.type,
      },
      metrics: { increment: "pipeline_started" },
    });

    const ocrResult = await runOCR(imageUrl, traceId);

    if (!ocrResult.sources.length) {
      logger.emit({
        scope: "quickadd.pipeline",
        event: "ocr_empty",
        traceId,
        level: "warn",
        metrics: { increment: "pipeline_ocr_empty" },
      });

      return;
    }

    const results: {
      source: string;
      entries: ValidatedEntry[];
      validCount: number;
    }[] = [];

    for (const source of ocrResult.sources) {
      try {
        if (!("tokens" in source) || !source.tokens?.length) continue;

        const layout = buildLayout(source.tokens, traceId);
        if (!layout.length) continue;

        const parsed: ParsedEntry[] = parseByType(
          session.type,
          { layout },
          traceId
        );

        if (!parsed.length) continue;

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
          scope: "quickadd.pipeline",
          event: "source_error",
          traceId,
          level: "warn",
          error: err,
          context: {
            source: source?.source,
          },
          metrics: { increment: "pipeline_source_error" },
        });
      }
    }

    if (!results.length) {
      logger.emit({
        scope: "quickadd.pipeline",
        event: "no_results",
        traceId,
        level: "warn",
        metrics: { increment: "pipeline_no_results" },
      });

      return;
    }

    const best = results.sort((a, b) => b.validCount - a.validCount)[0];

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

    logger.emit({
      scope: "quickadd.pipeline",
      event: "done",
      traceId,
      context: {
        sessionId: session.sessionId,
      },
      stats: {
        total: best.entries.length,
        valid: best.validCount,
      },
      timing: {
        label: "pipeline",
        durationMs: duration,
      },
      metrics: { increment: "pipeline_done" },
    });

  } catch (err) {
    logger.emit({
      scope: "quickadd.pipeline",
      event: "error",
      traceId,
      level: "error",
      error: err,
      metrics: { increment: "pipeline_error" },
    });
  }
}