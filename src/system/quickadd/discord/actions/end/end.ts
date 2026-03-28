// =====================================
// 📁 src/quickadd/discord/actions/end/end.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";

import {
  validateQuickAddContext,
  validateSessionOwner,
} from "../../../rules/QuickAddGuards";

import { logger } from "../../../../core/logger/log";

// =====================================
// 🔐 SAFE REPLY
// =====================================

async function safeReply(
  interaction: ChatInputCommandInteraction,
  content: string
) {
  try {
    await interaction.editReply(content);
  } catch {
    if (!interaction.replied) {
      await interaction
        .reply({ content, ephemeral: true })
        .catch(() => null);
    }
  }
}

// =====================================
// 🚀 HANDLER
// =====================================

export async function handleEnd(
  interaction: ChatInputCommandInteraction,
  traceId: string
): Promise<void> {
  const startTime = Date.now();

  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  // 🔥 REQUIRED (lifecycle fix)
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ ephemeral: true });
  }

  // =====================================
  // 📥 ENTRY LOG
  // =====================================

  logger.emit({
    scope: "quickadd.end",
    event: "end_requested",
    traceId,
    context: {
      guildId,
      userId,
    },
  });

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
    logger.emit({
      scope: "quickadd.end",
      event: "end_guard_failed",
      traceId,
      level: "warn",
      context: {
        guildId,
        userId,
        hasSession: !!session,
        contextError,
        ownerError,
      },
      stats: {
        end_blocked: 1,
      },
    });

    await safeReply(
      interaction,
      contextError ?? ownerError ?? "❌ Session not found"
    );
    return;
  }

  const { sessionId, threadId, stage } = session;

  try {
    logger.emit({
      scope: "quickadd.end",
      event: "end_start",
      traceId,
      context: {
        sessionId,
        guildId,
        threadId,
        stage,
      },
      stats: {
        end_started: 1,
      },
    });

    // =====================================
    // 🧹 CLEANUP
    // =====================================

    QuickAddBuffer.clear(sessionId, traceId);
    QuickAddSession.end(guildId, userId, traceId);

    logger.emit({
      scope: "quickadd.end",
      event: "session_ended",
      traceId,
      context: {
        sessionId,
        guildId,
        threadId,
      },
    });

    await safeReply(
      interaction,
      "🛑 QuickAdd session ended"
    );

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

        logger.emit({
          scope: "quickadd.end",
          event: "thread_deleted",
          traceId,
          context: {
            sessionId,
            threadId,
          },
        });
      }
    } catch (err) {
      logger.emit({
        scope: "quickadd.end",
        event: "thread_delete_failed",
        traceId,
        level: "warn",
        context: {
          sessionId,
        },
        stats: {
          end_thread_delete_failed: 1,
        },
        error: err,
      });
    }

    const duration = Date.now() - startTime;

    logger.emit({
      scope: "quickadd.end",
      event: "end_done",
      traceId,
      context: {
        sessionId,
      },
      stats: {
        end_success: 1,
        durationMs: duration,
      },
    });

  } catch (err) {
    const duration = Date.now() - startTime;

    logger.emit({
      scope: "quickadd.end",
      event: "end_failed",
      traceId,
      level: "error",
      context: {
        sessionId,
      },
      stats: {
        end_error: 1,
        durationMs: duration,
      },
      error: err,
    });

    await safeReply(
      interaction,
      "❌ Failed to end session"
    );
  }
}