// =====================================
// 📁 src/quickadd/discord/actions/cancel/cancel.ts
// =====================================

/**
 * ❌ ROLE:
 * Clears current QuickAdd buffer WITHOUT ending session.
 *
 * ❗ RULES:
 * - owner only (destructive operation)
 * - traceId MUST be injected
 * - NO fallback
 *
 * ✅ FINAL:
 * - global logger (log.emit)
 * - full observability (metrics + timing)
 * - zero logger coupling
 * - Discord-safe replies
 */

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

  if (!guildId) {
    await interaction.reply({
      content: "❌ Guild only command",
      ephemeral: true,
    });
    return;
  }

  const session = QuickAddSession.get(guildId);

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
    await interaction.reply({
      content:
        contextError ??
        ownerError ??
        "❌ Session not found",
      ephemeral: true,
    });
    return;
  }

  try {
    metrics.increment("cancel_started");

    log.emit({
      event: "cancel_start",
      traceId,
      data: {
        sessionId: session.sessionId,
        guildId,
      },
    });

    QuickAddBuffer.clear(guildId, traceId);

    log.emit({
      event: "cancel_buffer_cleared",
      traceId,
      data: {
        sessionId: session.sessionId,
      },
    });

    await interaction.reply({
      content: "🧹 Buffer cleared (session still active)",
      ephemeral: true,
    });

    const duration = timing.end(timerId);

    metrics.increment("cancel_success");

    log.emit({
      event: "cancel_done",
      traceId,
      data: {
        sessionId: session.sessionId,
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

    await interaction.reply({
      content: "❌ Failed to clear buffer",
      ephemeral: true,
    });
  }
}