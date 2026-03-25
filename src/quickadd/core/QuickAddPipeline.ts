// =====================================
// 📁 src/quickadd/core/QuickAddPipeline.ts
// =====================================

/**
 * 🧠 ROLE:
 * Central orchestrator of the QuickAdd pipeline.
 *
 * Flow:
 * OCR → layout → parser → validator → selection → buffer
 *
 * ❗ RULES:
 * - NO business logic
 * - orchestration only
 */

import { Message } from "discord.js";
import { createLogger } from "../debug/DebugLogger";

import { runOCR } from "../ocr/OCRProcessor";
import { parseByType } from "../parsing/ParserRouter";
import { validateEntries } from "../validation/QuickAddValidator";
import { QuickAddBuffer } from "../storage/QuickAddBuffer";
import { LayoutBuilder } from "../ocr/layout/LayoutBuilder";

import { QuickAddSession } from "./QuickAddSession";

const log = createLogger("PIPELINE");

export async function processImageInput(
  message: Message,
  session: ReturnType<typeof QuickAddSession.get>,
  imageUrl: string,
  traceId: string
) {
  const startedAt = Date.now();

  const guildId = message.guild?.id;
  const userId = message.author?.id;

  log.trace("pipeline_context_check", traceId, {
    guildId,
    userId,
    hasSession: !!session,
  });

  if (!guildId || !session) {
    log.warn("pipeline_invalid_context", traceId, {
      guildId,
      userId,
    });
    return;
  }

  try {
    log.trace("pipeline_start", traceId, {
      type: session.type,
      imageUrl,
    });

    // =====================================
    // 🔹 OCR
    // =====================================
    const ocrResult = await runOCR(imageUrl, traceId);

    if (!ocrResult.sources.length) {
      log.warn("ocr_empty", traceId);
      return;
    }

    // =====================================
    // 🔥 MULTI PIPELINE
    // =====================================
    const pipelineResults: {
      entries: any[];
      validCount: number;
    }[] = [];

    for (const source of ocrResult.sources) {
      try {
        log.trace("pipeline_source_start", traceId, {
          source: source.source,
        });

        // =====================================
        // 🧱 LAYOUT
        // =====================================
        let layout = [];

        if ("tokens" in source && source.tokens) {
          layout = LayoutBuilder.fromTokens(source.tokens);
        } else if ("lines" in source && source.lines) {
          layout = LayoutBuilder.fromLines(source.lines);
        }

        if (!layout.length) {
          log.trace("layout_empty", traceId, {
            source: source.source,
          });
          continue;
        }

        // =====================================
        // 🔹 PARSER
        // =====================================
        const parsed = parseByType(
          session.type,
          { layout },
          traceId
        );

        if (!parsed.length) continue;

        // =====================================
        // 🔹 VALIDATOR
        // =====================================
        const validated = await validateEntries(parsed, traceId);

        const validCount = validated.filter(
          (v) => v.status === "OK"
        ).length;

        pipelineResults.push({
          entries: validated,
          validCount,
        });

        log.trace("pipeline_source_done", traceId, {
          source: source.source,
          entries: validated.length,
          validCount,
        });

      } catch (err) {
        log.warn("pipeline_source_failed", traceId, {
          error: err,
        });
      }
    }

    // =====================================
    // 🔍 SELECTION (HYBRID)
    // =====================================
    if (!pipelineResults.length) {
      log.warn("pipeline_no_results", traceId);
      return;
    }

    const best = pipelineResults.sort((a, b) => {
      if (b.entries.length !== a.entries.length) {
        return b.entries.length - a.entries.length;
      }
      return b.validCount - a.validCount;
    })[0];

    log.trace("pipeline_selected", traceId, {
      entries: best.entries.length,
      valid: best.validCount,
    });

    // =====================================
    // 🔹 BUFFER
    // =====================================
    QuickAddBuffer.addEntries(
      guildId,
      best.entries.map((v) => ({
        nickname: v.nickname,
        value: v.value,
        status: v.status,
        confidence: v.confidence,
        suggestion: v.suggestion,
      }))
    );

    const total = QuickAddBuffer.getEntries(guildId).length;

    log.trace("pipeline_done", traceId, {
      total,
      durationMs: Date.now() - startedAt,
    });

  } catch (err) {
    log.error("pipeline_error", err, traceId);
  }
}