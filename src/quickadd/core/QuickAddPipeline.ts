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

  log.trace("pipeline_context_check", traceId, {
    sessionId: session?.sessionId,
    guildId,
    userId,
    hasSession: !!session,
  });

  if (!guildId || !session) {
    metrics.increment("pipeline_invalid_context");

    log.warn("pipeline_invalid_context", traceId, {
      sessionId: session?.sessionId,
      guildId,
      userId,
    });
    return;
  }

  try {
    metrics.increment("pipeline_started");

    log.trace("pipeline_start", traceId, {
      sessionId: session.sessionId,
      type: session.type,
      imageUrl,
    });

    const ocrResult = await runOCR(imageUrl, traceId);

    if (!ocrResult.sources.length) {
      metrics.increment("pipeline_ocr_empty");

      log.warn("pipeline_soft_error_ocr_empty", traceId, {
        sessionId: session.sessionId,
      });
      return;
    }

    const pipelineResults: {
      source: string;
      entries: ValidatedEntry[];
      validCount: number;
    }[] = [];

    for (const source of ocrResult.sources) {
      try {
        log.trace("pipeline_source_start", traceId, {
          sessionId: session.sessionId,
          source: source.source,
        });

        if (!("tokens" in source) || !source.tokens?.length) {
          continue;
        }

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

        const validCount = validated.filter(
          (v) => v.status === "OK"
        ).length;

        pipelineResults.push({
          source: source.source,
          entries: validated,
          validCount,
        });

      } catch (err) {
        metrics.increment("pipeline_source_error");

        log.warn("pipeline_source_failed", traceId, {
          sessionId: session.sessionId,
          source: source.source,
          error: err,
        });
      }
    }

    if (!pipelineResults.length) {
      metrics.increment("pipeline_no_results");

      log.warn("pipeline_soft_error_no_results", traceId, {
        sessionId: session.sessionId,
      });
      return;
    }

    const best = pipelineResults.sort((a, b) =>
      b.validCount - a.validCount
    )[0];

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

    const total = QuickAddBuffer.getEntries(guildId, traceId).length;

    const duration = timing.end(timerId);

    log.trace("pipeline_done", traceId, {
      sessionId: session.sessionId,
      total,
      durationMs: duration,
    });

  } catch (err) {
    metrics.increment("pipeline_error");

    log.error("pipeline_error", err, traceId);
  }
}