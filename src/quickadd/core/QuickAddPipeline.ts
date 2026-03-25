// =====================================
// 📁 src/quickadd/core/QuickAddPipeline.ts
// =====================================

/**
 * 🧠 ROLE:
 * Central orchestrator of the QuickAdd pipeline.
 *
 * Flow:
 * 1. OCR (OCRProcessor)
 * 2. parsing (ParserRouter)
 * 3. validation (QuickAddValidator)
 * 4. buffering (QuickAddBuffer)
 *
 * ❗ RULES:
 * - NO business logic (only orchestration)
 * - NO data mutation (delegate to modules)
 * - FULL trace logging (end-to-end)
 */

import { Message } from "discord.js";
import { createLogger } from "../debug/DebugLogger";

import { runOCR } from "../ocr/OCRProcessor";
import { parseByType } from "../parsing/ParserRouter";
import { validateEntries } from "../validation/QuickAddValidator";
import { QuickAddBuffer } from "../storage/QuickAddBuffer";

import { QuickAddSession } from "./QuickAddSession";

const log = createLogger("PIPELINE");

// =====================================
// 🔥 MAIN ENTRY
// =====================================

export async function processImageInput(
  message: Message,
  session: ReturnType<typeof QuickAddSession.get>,
  imageUrl: string,
  traceId: string
) {
  const guildId = message.guild?.id;
  const userId = message.author?.id;

  // =====================================
  // 🔍 CONTEXT CHECK
  // =====================================
  log.trace("pipeline_context_check", traceId, {
    guildId,
    userId,
    hasSession: !!session,
  });

  if (!guildId || !session) {
    log.warn("pipeline_invalid_context", {
      guildId,
      userId,
    });
    return;
  }

  try {
    // =====================================
    // 🚀 PIPELINE START
    // =====================================
    log.trace("pipeline_start", traceId, {
      type: session.type,
      imageUrl,
    });

    // =====================================
    // 🔹 1. OCR
    // =====================================
    log.trace("ocr_stage_start", traceId);

    const ocrResult = await runOCR(imageUrl, traceId);

    log.trace("ocr_stage_result", traceId, {
      sources: ocrResult.sources.length,
    });

    if (!ocrResult.sources.length) {
      log.warn("ocr_empty", { traceId });
      return;
    }

    // =====================================
    // 🔹 PICK BEST SOURCES
    // =====================================
    const lineSource = ocrResult.sources.find(
      (s) => "lines" in s && s.lines.length > 0
    );

    const tokenSource = ocrResult.sources.find(
      (s) => "tokens" in s && s.tokens.length > 0
    );

    log.trace("ocr_sources_selected", traceId, {
      hasLines: !!lineSource,
      hasTokens: !!tokenSource,
    });

    // =====================================
    // 🔹 2. PARSING
    // =====================================
    log.trace("parser_stage_start", traceId, {
      type: session.type,
    });

    const parsed = parseByType(
      session.type,
      {
        lines: lineSource && "lines" in lineSource ? lineSource.lines : undefined,
        tokens: tokenSource && "tokens" in tokenSource ? tokenSource.tokens : undefined,
      },
      traceId
    );

    if (!parsed.length) {
      log.warn("parser_empty", { traceId });
      return;
    }

    log.trace("parser_stage_result", traceId, {
      parsed: parsed.length,
    });

    // =====================================
    // 🔹 3. VALIDATION
    // =====================================
    log.trace("validation_stage_start", traceId);

    const validated = await validateEntries(parsed);

    log.trace("validation_stage_result", traceId, {
      validated: validated.length,
    });

    // =====================================
    // 🔹 4. BUFFER
    // =====================================
    log.trace("buffer_stage_start", traceId);

    QuickAddBuffer.addEntries(
      guildId,
      validated.map((v) => ({
        nickname: v.nickname,
        value: v.value,
        status: v.status,
        confidence: v.confidence,
        suggestion: v.suggestion,
      }))
    );

    const total = QuickAddBuffer.getEntries(guildId).length;

    log.trace("buffer_stage_result", traceId, {
      added: validated.length,
      total,
    });

    // =====================================
    // ✅ PIPELINE DONE
    // =====================================
    log.trace("pipeline_done", traceId, {
      total,
    });

  } catch (err) {
    log.error("pipeline_error", err, traceId);
  }
}