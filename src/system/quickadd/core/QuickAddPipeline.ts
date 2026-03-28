// =====================================
// 📁 src/system/quickadd/core/QuickAddPipeline.ts
// =====================================

import { Message } from "discord.js";
import { log } from "../../../core/logger/log";

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
 * - OCR → layout → parsing → validation → selection
 * - pushing best entries into buffer
 *
 * ❗ RULES:
 * - NO ID generation
 * - MUST use provided traceId
 * - log.emit ONLY (no scoped logger)
 * - pipeline = orchestrator (NO business logic)
 *
 * FLOW:
 * OCR → Layout → Parser → Validator → Select Best → Buffer
 */

export async function processImageInput(
  message: Message,
  session: ReturnType<typeof QuickAddSession.get>,
  imageUrl: string,
  traceId: string
): Promise<void> {
  const startedAt = Date.now();

  const guildId = message.guild?.id;
  const userId = message.author?.id;

  // =====================================
  // 📥 CONTEXT CHECK
  // =====================================

  log.emit({
    event: "pipeline_context_check",
    traceId,
    data: {
      sessionId: session?.sessionId,
      guildId,
      userId,
    },
  });

  if (!guildId || !session) {
    log.emit({
      event: "pipeline_invalid_context",
      traceId,
      level: "warn",
      data: {
        guildId,
        userId,
        hasSession: !!session,
      },
    });
    return;
  }

  try {
    log.emit({
      event: "pipeline_start",
      traceId,
      data: {
        sessionId: session.sessionId,
        type: session.type,
      },
    });

    // =====================================
    // 🧠 OCR
    // =====================================

    const ocrResult = await runOCR(imageUrl, traceId);

    if (!ocrResult.sources.length) {
      log.emit({
        event: "pipeline_ocr_empty",
        traceId,
        level: "warn",
        data: {
          sessionId: session.sessionId,
        },
      });
      return;
    }

    // =====================================
    // 🔄 MULTI-SOURCE PROCESSING
    // =====================================

    const results: {
      source: string;
      entries: ValidatedEntry[];
      validCount: number;
    }[] = [];

    for (const source of ocrResult.sources) {
      try {
        if (!("tokens" in source) || !source.tokens?.length) {
          continue;
        }

        // =============================
        // 📐 LAYOUT
        // =============================
        const layout = buildLayout(source.tokens, traceId);
        if (!layout.length) continue;

        // =============================
        // 🧠 PARSER
        // =============================
        const parsed: ParsedEntry[] = parseByType(
          session.type,
          { layout },
          traceId
        );

        if (!parsed.length) continue;

        // =============================
        // ✅ VALIDATION
        // =============================
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

        results.push({
          source: source.source,
          entries: validated,
          validCount,
        });

      } catch (err) {
        log.emit({
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
      log.emit({
        event: "pipeline_no_results",
        traceId,
        level: "warn",
        data: {
          sessionId: session.sessionId,
        },
      });
      return;
    }

    // =====================================
    // 🏆 SELECT BEST SOURCE
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

    // =====================================
    // ✅ DONE
    // =====================================

    const duration = Date.now() - startedAt;

    log.emit({
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
    log.emit({
      event: "pipeline_failed",
      traceId,
      level: "error",
      data: {
        error: err,
      },
    });
  }
}