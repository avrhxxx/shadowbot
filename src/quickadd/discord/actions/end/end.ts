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

export async function handleEnd(
  interaction: ChatInputCommandInteraction,
  traceId: string
): Promise<void> {
  const timerId = `end-${traceId}`;
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
    metrics.increment("end_started");

    const { sessionId, threadId } = session;

    log.emit({
      event: "end_start",
      traceId,
      data: {
        sessionId,
        guildId,
        threadId,
      },
    });

    // =====================================
    // 🧹 CLEANUP (FIXED)
    // =====================================

    QuickAddBuffer.clear(guildId, traceId); // ✅ FIX
    QuickAddSession.end(guildId, userId, traceId); // ✅ FIX

    log.emit({
      event: "session_ended",
      traceId,
      data: {
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

        log.emit({
          event: "thread_deleted",
          traceId,
          data: {
            sessionId,
            threadId,
          },
        });
      }
    } catch (err) {
      metrics.increment("end_thread_delete_failed");

      log.emit({
        event: "thread_delete_failed",
        traceId,
        level: "warn",
        data: {
          sessionId,
          error: err,
        },
      });
    }

    const duration = timing.end(timerId);

    metrics.increment("end_success");

    log.emit({
      event: "end_done",
      traceId,
      data: {
        sessionId,
        durationMs: duration,
      },
    });

  } catch (err) {
    const duration = timing.end(timerId);

    metrics.increment("end_error");

    log.emit({
      event: "end_failed",
      traceId,
      level: "error",
      data: {
        error: err,
        durationMs: duration,
      },
    });

    await safeReply(
      interaction,
      "❌ Failed to end session"
    );
  }
}