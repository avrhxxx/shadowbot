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
 * - FULL traceId propagation (STRICT)
 */

import { Message } from "discord.js";
import { createScopedLogger } from "@/quickadd/debug/logger";

import { runOCR } from "../ocr/OCRProcessor";
import { parseByType, ParsedEntry } from "../parsing/ParserRouter";
import {
  validateEntries,
  ValidatedEntry,
} from "../validation/QuickAddValidator";
import { QuickAddBuffer } from "../storage/QuickAddBuffer";
import { buildLayout } from "../ocr/layout/LayoutBuilder";

import { QuickAddSession } from "./QuickAddSession";

const log = createScopedLogger(import.meta.url);

// =====================================
// 🚀 MAIN ENTRY
// =====================================

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
    sessionId: session?.sessionId,
    guildId,
    userId,
    hasSession: !!session,
  });

  if (!guildId || !session) {
    log.warn("pipeline_invalid_context", {
      traceId,
      sessionId: session?.sessionId,
      guildId,
      userId,
    });
    return;
  }

  try {
    log.trace("pipeline_start", traceId, {
      sessionId: session.sessionId,
      type: session.type,
      imageUrl,
    });

    // =====================================
    // 🔹 OCR
    // =====================================
    const ocrResult = await runOCR(imageUrl, traceId);

    if (!ocrResult.sources.length) {
      log.warn("pipeline_soft_error_ocr_empty", {
        traceId,
        sessionId: session.sessionId,
      });
      return;
    }

    // =====================================
    // 🔥 MULTI PIPELINE
    // =====================================
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

        let layout = [];

        if ("tokens" in source && source.tokens?.length) {
          layout = buildLayout(source.tokens, traceId);
        } else {
          log.trace("layout_skipped_no_tokens", traceId, {
            sessionId: session.sessionId,
            source: source.source,
          });
          continue;
        }

        if (!layout.length) {
          log.trace("layout_empty_for_source", traceId, {
            sessionId: session.sessionId,
            source: source.source,
          });
          continue;
        }

        const parsed: ParsedEntry[] = parseByType(
          session.type,
          { layout },
          traceId
        );

        if (!parsed.length) {
          log.trace("parser_empty_for_source", traceId, {
            sessionId: session.sessionId,
            source: source.source,
          });
          continue;
        }

        // ✅ STRICT INPUT SHAPE
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

        log.trace("pipeline_source_done", traceId, {
          sessionId: session.sessionId,
          source: source.source,
          entries: validated.length,
          validCount,
        });

      } catch (err) {
        log.warn("pipeline_source_failed", {
          traceId,
          sessionId: session.sessionId,
          source: source.source,
          error: err,
        });
      }
    }

    // =====================================
    // 🔍 SELECTION (HYBRID)
    // =====================================
    if (!pipelineResults.length) {
      log.warn("pipeline_soft_error_no_results", {
        traceId,
        sessionId: session.sessionId,
      });
      return;
    }

    const best = pipelineResults.sort((a, b) => {
      if (b.entries.length !== a.entries.length) {
        return b.entries.length - a.entries.length;
      }

      if (b.validCount !== a.validCount) {
        return b.validCount - a.validCount;
      }

      if (a.source === "VISION") return -1;
      if (b.source === "VISION") return 1;

      return 0;
    })[0];

    log.trace("pipeline_selected", traceId, {
      sessionId: session.sessionId,
      source: best.source,
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
        source: best.source,
      })),
      traceId
    );

    const total = QuickAddBuffer.getEntries(
      guildId,
      traceId
    ).length;

    // =====================================
    // ✅ DONE
    // =====================================
    log.trace("pipeline_done", traceId, {
      sessionId: session.sessionId,
      source: best.source,
      total,
      durationMs: Date.now() - startedAt,
    });

  } catch (err) {
    log.error("pipeline_error", err, traceId);
  }
}