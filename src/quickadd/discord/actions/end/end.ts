// =====================================
// 📁 src/quickadd/discord/actions/end/end.ts
// =====================================

/**
 * 🛑 ROLE:
 * Terminates QuickAdd session completely.
 *
 * ❗ RULES:
 * - destructive
 * - owner only
 *
 * 🔥 NOTE:
 * - traceId injected from CommandRouter
 * - fallback to session.traceId (temporary)
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
  interaction: ChatInputCommandInteraction,
  traceId?: string // 🔥 NEW
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

  // =====================================
  // 🔥 TRACE RESOLUTION
  // =====================================
  const resolvedTraceId = traceId || session?.traceId;

  if (!resolvedTraceId) {
    throw new Error("Missing traceId");
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

    log.trace("session_ended", resolvedTraceId, {
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

        log.trace("thread_deleted", resolvedTraceId, {
          threadId,
        });
      }
    } catch (err) {
      log.warn("thread_delete_failed", resolvedTraceId, {
        error: err,
      });
    }

    log.trace("end_done", resolvedTraceId, {
      durationMs: Date.now() - startedAt,
    });

  } catch (err) {
    log.error("end_failed", err, resolvedTraceId);

    await interaction.reply({
      content: "❌ Failed to end session",
      ephemeral: true,
    });
  }
}