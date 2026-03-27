// =====================================
// 📁 src/quickadd/discord/actions/cancel/cancel.ts
// =====================================

/**
 * ❌ ROLE:
 * Clears current QuickAdd buffer WITHOUT ending session.
 */

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";
import { validateQuickAddContext } from "../../../rules/QuickAddGuards";

import { createScopedLogger } from "@/quickadd/debug/logger";

const log = createScopedLogger(import.meta.url);

export async function handleCancel(
  interaction: ChatInputCommandInteraction,
  traceId: string
): Promise<void> {
  const startedAt = Date.now();

  const guildId = interaction.guildId;

  if (!guildId) {
    await interaction.reply({ content: "❌ Guild only command", ephemeral: true });
    return;
  }

  const session = QuickAddSession.get(guildId);
  const contextError = validateQuickAddContext(interaction, session);

  if (contextError || !session) {
    await interaction.reply({ content: contextError ?? "❌ Session not found", ephemeral: true });
    return;
  }

  try {
    log.trace("cancel_start", traceId, { sessionId: session.sessionId, guildId });

    QuickAddBuffer.clear(guildId, traceId);

    log.trace("cancel_buffer_cleared", traceId, { sessionId: session.sessionId });

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