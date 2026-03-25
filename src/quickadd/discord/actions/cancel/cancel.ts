// =====================================
// 📁 src/quickadd/discord/actions/cancel/cancel.ts
// =====================================

/**
 * ❌ ROLE:
 * Clears current QuickAdd buffer WITHOUT ending session.
 *
 * Responsible for:
 * - validating session + context
 * - clearing buffer only
 *
 * ❗ RULES:
 * - DOES NOT end session
 * - DOES NOT send anything to queue
 * - user can continue flow after this
 */

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";
import { validateQuickAddContext } from "../../../rules/QuickAddGuards";

import { createLogger } from "../../../debug/DebugLogger";

const log = createLogger("CMD_CANCEL");

// =====================================
// 🚀 HANDLER
// =====================================

export async function handleCancel(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const guildId = interaction.guildId;

  if (!guildId) {
    await interaction.reply({
      content: "❌ Guild only command",
      ephemeral: true,
    });
    return;
  }

  const session = QuickAddSession.get(guildId);

  // =====================================
  // 🔒 VALIDATION (SESSION + THREAD)
  // =====================================
  const contextError = validateQuickAddContext(interaction, session);

  if (contextError) {
    await interaction.reply({
      content: contextError,
      ephemeral: true,
    });
    return;
  }

  try {
    // =====================================
    // 🧹 CLEAR BUFFER ONLY
    // =====================================
    QuickAddBuffer.clear(guildId);

    log.trace("cancel_buffer_cleared", guildId, {
      guildId,
    });

    // =====================================
    // 📤 RESPONSE
    // =====================================
    await interaction.reply({
      content: "🧹 Buffer cleared (session still active)",
      ephemeral: true,
    });

  } catch (err) {
    log.error("cancel_failed", err);

    await interaction.reply({
      content: "❌ Failed to clear buffer",
      ephemeral: true,
    });
  }
}