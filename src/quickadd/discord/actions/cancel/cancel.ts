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

import { log, metrics, timing } from "../../../logger";

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
        .reply({ content, flags: 64 })
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
  const timerId = `cancel-${traceId}`;
  timing.start(timerId);

  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  // 🔥 lifecycle fix (CRITICAL)
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ flags: 64 });
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
    metrics.increment("cancel_blocked");

    log.emit({
      event: "cancel_guard_failed",
      traceId,
      level: "warn",
      data: {
        guildId,
        userId,
        hasSession: !!session,
        contextError,
        ownerError,
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
    metrics.increment("cancel_started");

    log.emit({
      event: "cancel_start",
      traceId,
      data: {
        sessionId,
        guildId,
        userId,
      },
    });

    // =====================================
    // 🧹 CLEAR BUFFER
    // =====================================
    QuickAddBuffer.clear(sessionId, traceId);

    log.emit({
      event: "cancel_buffer_cleared",
      traceId,
      data: {
        sessionId,
      },
    });

    await safeReply(
      interaction,
      "🧹 Buffer cleared (session still active)"
    );

    const duration = timing.end(timerId);

    metrics.increment("cancel_success");

    log.emit({
      event: "cancel_done",
      traceId,
      data: {
        sessionId,
        durationMs: duration,
      },
    });

  } catch (err) {
    const duration = timing.end(timerId);

    metrics.increment("cancel_error");

    log.emit({
      event: "cancel_failed",
      traceId,
      level: "error",
      data: {
        sessionId,
        error: err,
        durationMs: duration,
      },
    });

    await safeReply(
      interaction,
      "❌ Failed to clear buffer"
    );
  }
}