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
// 🔐 SAFE REPLY
// =====================================

async function safeReply(
  interaction: ChatInputCommandInteraction,
  content: string
) {
  if (!interaction.replied && !interaction.deferred) {
    await interaction.reply({ content, ephemeral: true });
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
    await safeReply(
      interaction,
      contextError ?? ownerError ?? "❌ Session not found"
    );
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

    await safeReply(
      interaction,
      "❌ Failed to clear buffer"
    );
  }
}