// =====================================
// 📁 src/quickadd/core/QuickAddPipeline.ts
// =====================================

import { Message } from "discord.js";
import { log, metrics, timing } from "../logger";

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
 * - FULL observability (log + metrics + timing)
 */

export async function processImageInput(
  message: Message,
  session: ReturnType<typeof QuickAddSession.get>,
  imageUrl: string,
  traceId: string
) {
  const timerId = `pipeline-${traceId}`;
  timing.start(timerId);

  const guildId = message.guild?.id;
  const userId = message.author?.id;

  log.emit({
    event: "pipeline_context_check",
    traceId,
    data: { sessionId: session?.sessionId, guildId, userId },
  });

  if (!guildId || !session) {
    metrics.increment("pipeline_invalid_context");

    log.emit({
      event: "pipeline_invalid_context",
      traceId,
      level: "warn",
      data: { guildId, userId },
    });

    return;
  }

  try {
    metrics.increment("pipeline_started");

    log.emit({
      event: "pipeline_start",
      traceId,
      data: {
        sessionId: session.sessionId,
        type: session.type,
      },
    });

    const ocrResult = await runOCR(imageUrl, traceId);

    if (!ocrResult.sources.length) {
      metrics.increment("pipeline_ocr_empty");

      log.emit({
        event: "pipeline_ocr_empty",
        traceId,
        level: "warn",
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
        metrics.increment("pipeline_source_error");

        log.emit({
          event: "pipeline_source_error",
          traceId,
          level: "warn",
          data: { error: err },
        });
      }
    }

    if (!results.length) {
      metrics.increment("pipeline_no_results");

      log.emit({
        event: "pipeline_no_results",
        traceId,
        level: "warn",
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

    const duration = timing.end(timerId);

    log.emit({
      event: "pipeline_done",
      traceId,
      data: {
        sessionId: session.sessionId,
        total: best.entries.length,
        durationMs: duration,
      },
    });

  } catch (err) {
    metrics.increment("pipeline_error");

    log.emit({
      event: "pipeline_error",
      traceId,
      level: "error",
      data: { error: err },
    });
  }
}