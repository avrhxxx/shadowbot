// =====================================
// 📁 src/quickadd/discord/actions/cancel/cancel.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";

import {
  validateQuickAddContext,
  validateSessionOwner,
} from "../../../rules/QuickAddGuards";

import { logger } from "../../../../core/logger/log";

// =====================================
// 🔐 SAFE REPLY
// =====================================

async function safeReply(
  interaction: ChatInputCommandInteraction,
  content: string
) {
  try {
    await interaction.editReply(content);
  } catch {
    if (!interaction.replied) {
      await interaction
        .reply({ content, ephemeral: true })
        .catch(() => null);
    }
  }
}

// =====================================
// 🚀 HANDLER
// =====================================

export async function handleCancel(
  interaction: ChatInputCommandInteraction,
  traceId: string
): Promise<void> {
  const startTime = Date.now();

  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  // 🔥 lifecycle fix (CRITICAL)
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ ephemeral: true });
  }

  if (!guildId) {
    await safeReply(interaction, "❌ Guild only command");
    return;
  }

  const session = QuickAddSession.get(guildId, userId);

  const contextError = validateQuickAddContext(
    interaction,
    session,
    traceId
  );

  const ownerError = validateSessionOwner(
    interaction,
    session,
    traceId
  );

  if (contextError || ownerError || !session) {
    logger.emit({
      scope: "quickadd.cancel",
      event: "cancel_guard_failed",
      traceId,
      level: "warn",
      context: {
        guildId,
        userId,
        hasSession: !!session,
        contextError,
        ownerError,
      },
      stats: {
        cancel_blocked: 1,
      },
    });

    await safeReply(
      interaction,
      contextError ?? ownerError ?? "❌ Session not found"
    );
    return;
  }

  const sessionId = session.sessionId;

  try {
    logger.emit({
      scope: "quickadd.cancel",
      event: "cancel_start",
      traceId,
      context: {
        sessionId,
        guildId,
        userId,
      },
      stats: {
        cancel_started: 1,
      },
    });

    // =====================================
    // 🧹 CLEAR BUFFER
    // =====================================
    QuickAddBuffer.clear(sessionId, traceId);

    logger.emit({
      scope: "quickadd.cancel",
      event: "cancel_buffer_cleared",
      traceId,
      context: {
        sessionId,
      },
    });

    await safeReply(
      interaction,
      "🧹 Buffer cleared (session still active)"
    );

    const duration = Date.now() - startTime;

    logger.emit({
      scope: "quickadd.cancel",
      event: "cancel_done",
      traceId,
      context: {
        sessionId,
      },
      stats: {
        cancel_success: 1,
        durationMs: duration,
      },
    });

  } catch (err) {
    const duration = Date.now() - startTime;

    logger.emit({
      scope: "quickadd.cancel",
      event: "cancel_failed",
      traceId,
      level: "error",
      context: {
        sessionId,
      },
      stats: {
        cancel_error: 1,
        durationMs: duration,
      },
      error: err,
    });

    await safeReply(
      interaction,
      "❌ Failed to clear buffer"
    );
  }
}