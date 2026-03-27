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
 * - relative imports (Node-safe)
 * - validator API unified (traceId)
 * - Discord-safe replies
 */

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";

import {
  validateQuickAddContext,
  validateSessionOwner,
} from "../../../rules/QuickAddGuards";

import { createScopedLogger } from "../../../debug/logger";

const log = createScopedLogger(import.meta.url);

// =====================================
// 🚀 HANDLER
// =====================================

export async function handleCancel(
  interaction: ChatInputCommandInteraction,
  traceId: string
): Promise<void> {
  const startedAt = Date.now();

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
    log.trace("cancel_start", traceId, {
      sessionId: session.sessionId,
      guildId,
    });

    QuickAddBuffer.clear(guildId, traceId);

    log.trace("cancel_buffer_cleared", traceId, {
      sessionId: session.sessionId,
    });

    await interaction.reply({
      content: "🧹 Buffer cleared (session still active)",
      ephemeral: true,
    });

    log.trace("cancel_done", traceId, {
      sessionId: session.sessionId,
      durationMs: Date.now() - startedAt,
    });

  } catch (err) {
    log.error("cancel_failed", err, traceId);

    await interaction.reply({
      content: "❌ Failed to clear buffer",
      ephemeral: true,
    });
  }
}