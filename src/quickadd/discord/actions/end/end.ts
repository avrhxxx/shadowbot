// =====================================
// 📁 src/quickadd/discord/actions/end/end.ts
// =====================================

/**
 * 🛑 ROLE:
 * Terminates QuickAdd session completely.
 *
 * Responsible for:
 * - validating session + ownership
 * - clearing buffer
 * - ending session
 * - optionally deleting thread
 *
 * ❗ RULES:
 * - destructive operation
 * - only session owner can execute
 * - no external side-effects (no queue, no learning)
 */

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";
import {
  validateQuickAddContext,
  validateSessionOwner,
} from "../../../rules/QuickAddGuards";

import { createLogger } from "../../../debug/DebugLogger";

const log = createLogger("CMD_END");

// =====================================
// 🚀 HANDLER
// =====================================

export async function handleEnd(
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
  // 🔒 VALIDATION
  // =====================================
  const contextError = validateQuickAddContext(interaction, session);
  if (contextError) {
    await interaction.reply({
      content: contextError,
      ephemeral: true,
    });
    return;
  }

  const ownerError = validateSessionOwner(interaction, session);
  if (ownerError) {
    await interaction.reply({
      content: ownerError,
      ephemeral: true,
    });
    return;
  }

  try {
    const threadId = session!.threadId;

    // =====================================
    // 🧹 CLEAR BUFFER
    // =====================================
    QuickAddBuffer.clear(guildId);

    // =====================================
    // 🧠 END SESSION
    // =====================================
    QuickAddSession.end(guildId);

    log("session_ended", {
      guildId,
      threadId,
    });

    // =====================================
    // 📤 RESPONSE
    // =====================================
    await interaction.reply({
      content: "🛑 QuickAdd session ended",
      ephemeral: true,
    });

    // =====================================
    // 🧵 OPTIONAL: DELETE THREAD
    // =====================================
    try {
      const channel = interaction.channel;

      if (channel && "deletable" in channel && channel.deletable) {
        await channel.delete();

        log("thread_deleted", {
          threadId,
        });
      }
    } catch (err) {
      log.warn("thread_delete_failed", err);
    }

  } catch (err) {
    log.error("end_failed", err);

    await interaction.reply({
      content: "❌ Failed to end session",
      ephemeral: true,
    });
  }
}