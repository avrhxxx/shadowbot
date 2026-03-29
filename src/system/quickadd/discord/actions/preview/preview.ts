// =====================================
// 📁 src/system/quickadd/discord/actions/preview/preview.ts
// =====================================

import { Message } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { processImageInput } from "../../../core/QuickAddPipeline";

import { log } from "../../../../core/logger/log";
import { TraceContext } from "../../../../core/trace/TraceContext";

/**
 * 🧠 ROLE:
 * Handles image preview input (OCR trigger).
 *
 * Responsible for:
 * - validating session
 * - extracting image URL
 * - calling pipeline
 *
 * ❗ RULES:
 * - NO business logic
 * - NO OCR / parsing here
 * - pipeline handles everything
 */

export async function handlePreview(
  message: Message,
  ctx: TraceContext
): Promise<void> {
  const l = log.ctx(ctx);

  const guildId = message.guild?.id;
  const userId = message.author?.id;

  l.event("preview_received", {
    guildId,
    userId,
  });

  if (!guildId || !userId) {
    l.warn("preview_invalid_context", {
      guildId,
      userId,
    });
    return;
  }

  const session = QuickAddSession.get(guildId, userId);

  if (!session) {
    l.warn("preview_no_session", {
      guildId,
      userId,
    });
    return;
  }

  const attachment = message.attachments.first();

  if (!attachment?.url) {
    l.warn("preview_no_image", {
      sessionId: session.sessionId,
    });
    return;
  }

  try {
    l.event("preview_pipeline_start", {
      sessionId: session.sessionId,
      imageUrl: attachment.url,
    });

    await processImageInput(
      message,
      session,
      attachment.url,
      ctx.traceId
    );

    l.event("preview_pipeline_done", {
      sessionId: session.sessionId,
    });

  } catch (err) {
    l.error("preview_failed", {
      sessionId: session.sessionId,
      error: err,
    });
  }
}