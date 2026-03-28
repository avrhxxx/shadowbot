// =====================================
// 📁 src/system/quickadd/discord/actions/preview/preview.ts
// =====================================

import { Message } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { processImageInput } from "../../../core/QuickAddPipeline";

import { logger } from "../../../../core/logger/log";

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
  traceId: string
): Promise<void> {
  const guildId = message.guild?.id;
  const userId = message.author?.id;

  logger.emit({
    scope: "quickadd.preview",
    event: "preview_received",
    traceId,
    context: {
      guildId,
      userId,
    },
  });

  if (!guildId || !userId) {
    logger.emit({
      scope: "quickadd.preview",
      event: "preview_invalid_context",
      traceId,
      level: "warn",
      context: {
        guildId,
        userId,
      },
    });
    return;
  }

  const session = QuickAddSession.get(guildId, userId);

  if (!session) {
    logger.emit({
      scope: "quickadd.preview",
      event: "preview_no_session",
      traceId,
      level: "warn",
      context: {
        guildId,
        userId,
      },
    });
    return;
  }

  const attachment = message.attachments.first();

  if (!attachment?.url) {
    logger.emit({
      scope: "quickadd.preview",
      event: "preview_no_image",
      traceId,
      level: "warn",
      context: {
        sessionId: session.sessionId,
      },
    });
    return;
  }

  try {
    logger.emit({
      scope: "quickadd.preview",
      event: "preview_pipeline_start",
      traceId,
      context: {
        sessionId: session.sessionId,
        imageUrl: attachment.url,
      },
    });

    await processImageInput(
      message,
      session,
      attachment.url,
      traceId
    );

    logger.emit({
      scope: "quickadd.preview",
      event: "preview_pipeline_done",
      traceId,
      context: {
        sessionId: session.sessionId,
      },
    });

  } catch (err) {
    logger.emit({
      scope: "quickadd.preview",
      event: "preview_failed",
      traceId,
      level: "error",
      context: {
        sessionId: session.sessionId,
      },
      error: err,
    });
  }
}