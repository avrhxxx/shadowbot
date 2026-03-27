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
      data: {
        sessionId,
        guildId,
      },
    });

    // 🔥 SESSION-BASED BUFFER
    QuickAddBuffer.clear(sessionId, traceId);

    log.emit({
      event: "cancel_buffer_cleared",
      traceId,
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
        error: err,
        durationMs: duration,
      },
    });

    await interaction.editReply(
      "❌ Failed to clear buffer"
    );
  }
}