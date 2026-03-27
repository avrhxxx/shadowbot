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
 * - traceId MUST be injected
 * - NO traceId fallback
 * - sessionId included in logs
 * - CJS SAFE
 *
 * ✅ FINAL:
 * - full cleanup (buffer + session)
 * - safe Discord thread deletion
 * - guarded execution
 */

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";

import {
  validateQuickAddContext,
  validateSessionOwner,
} from "../../../rules/QuickAddGuards";

import { createScopedLogger } from "../../../debug/logger";

// ❗ CJS SAFE
const log = createScopedLogger(__filename);

// =====================================
// 🚀 HANDLER
// =====================================

export async function handleEnd(
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

  const contextError = validateQuickAddContext(interaction, session);
  const ownerError = validateSessionOwner(interaction, session);

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
    const threadId = session.threadId;

    log.trace("end_start", traceId, {
      sessionId: session.sessionId,
      guildId,
      threadId,
    });

    // =====================================
    // 🧹 CLEANUP
    // =====================================

    QuickAddBuffer.clear(guildId, traceId);
    QuickAddSession.end(guildId, traceId);

    log.trace("session_ended", traceId, {
      sessionId: session.sessionId,
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
    // 🧵 THREAD DELETE (SAFE)
    // =====================================

    try {
      const channel = interaction.channel;

      if (
        channel &&
        typeof channel === "object" &&
        "deletable" in channel &&
        channel.deletable
      ) {
        await channel.delete();

        log.trace("thread_deleted", traceId, {
          sessionId: session.sessionId,
          threadId,
        });
      }
    } catch (err) {
      log.warn("thread_delete_failed", traceId, {
        sessionId: session.sessionId,
        error: err,
      });
    }

    log.trace("end_done", traceId, {
      sessionId: session.sessionId,
      durationMs: Date.now() - startedAt,
    });

  } catch (err) {
    log.error("end_failed", err, traceId);

    await interaction.reply({
      content: "❌ Failed to end session",
      ephemeral: true,
    });
  }
}