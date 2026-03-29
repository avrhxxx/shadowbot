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
import { TraceContext } from "../../../core/trace/TraceContext";

/**
 * 🧠 ROLE:
 * Main processing pipeline for QuickAdd OCR input.
 */

export async function processImageInput(
  message: Message,
  session: ReturnType<typeof QuickAddSession.get>,
  imageUrl: string,
  ctx: TraceContext
): Promise<void> {
  const startedAt = Date.now();
  const l = log.ctx(ctx);

  const guildId = message.guild?.id;
  const userId = message.author?.id;

  // =====================================
  // 📥 CONTEXT CHECK
  // =====================================

  l.event("pipeline_context_check", {
    context: {
      sessionId: session?.sessionId,
      guildId,
      userId,
    },
  });

  if (!guildId || !session) {
    l.warn("pipeline_invalid_context", {
      context: {
        guildId,
        userId,
        hasSession: !!session,
      },
    });
    return;
  }

  try {
    l.event("pipeline_start", {
      context: {
        sessionId: session.sessionId,
        type: session.type,
      },
    });

    // =====================================
    // 🧠 OCR
    // =====================================

    const ocrResult = await runOCR(imageUrl, ctx);

    if (!ocrResult.sources.length) {
      l.warn("pipeline_ocr_empty", {
        context: {
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
        const layout = buildLayout(source.tokens, ctx);
        if (!layout.length) continue;

        // =============================
        // 🧠 PARSER
        // =============================
        const parsed: ParsedEntry[] = parseByType(
          session.type,
          { layout },
          ctx
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
          ctx
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
        l.warn("pipeline_source_error", {
          context: {
            source: source?.source,
          },
          error: err,
        });
      }
    }

    // =====================================
    // ❌ NO RESULTS
    // =====================================

    if (!results.length) {
      l.warn("pipeline_no_results", {
        context: {
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
      session.sessionId, // 🔥 FIX (was guildId ❌)
      best.entries.map((v) => ({
        nickname: v.nickname,
        value: v.value,
        status: v.status,
        confidence: v.confidence,
        suggestion: v.suggestion,
        source: best.source,
      })),
      ctx
    );

    // =====================================
    // ✅ DONE
    // =====================================

    const duration = Date.now() - startedAt;

    l.event("pipeline_done", {
      context: {
        sessionId: session.sessionId,
        total: best.entries.length,
        valid: best.validCount,
      },
      stats: {
        durationMs: duration,
      },
    });

  } catch (err) {
    l.error("pipeline_failed", {
      error: err,
    });
  }
}