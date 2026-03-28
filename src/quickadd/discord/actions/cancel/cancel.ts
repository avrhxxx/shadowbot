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

  if (!guildId) {
    await interaction.editReply("❌ Guild only command");
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
    log.emit({
      event: "cancel_guard_failed",
      traceId,
      type: "user",
      level: "warn",
      data: {
        guildId,
        userId,
        hasSession: !!session,
        contextError,
        ownerError,
      },
    });

    await interaction.editReply(
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
      type: "user",
      data: {
        sessionId,
        guildId,
        userId,
      },
    });

    // 🔥 SESSION-BASED BUFFER
    QuickAddBuffer.clear(sessionId, traceId);

    log.emit({
      event: "cancel_buffer_cleared",
      traceId,
      type: "user",
      data: {
        sessionId,
      },
    });

    await interaction.editReply(
      "🧹 Buffer cleared (session still active)"
    );

    const duration = timing.end(timerId);

    metrics.increment("cancel_success");

    log.emit({
      event: "cancel_done",
      traceId,
      type: "user",
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
      type: "user",
      level: "error",
      data: {
        sessionId,
        error: err,
        durationMs: duration,
      },
    });

    await interaction.editReply(
      "❌ Failed to clear buffer"
    );
  }
}