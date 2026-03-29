// =====================================
// 📁 src/system/quickadd/discord/actions/end/end.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";

import {
  validateQuickAddContext,
  validateSessionOwner,
} from "../../../rules/QuickAddGuards";

import { log } from "../../../../core/logger/log";
import { TraceContext } from "../../../../core/trace/TraceContext";

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
        .reply({ content, flags: 64 })
        .catch(() => null);
    }
  }
}

// =====================================
// 🚀 HANDLER
// =====================================

export async function handleEnd(
  interaction: ChatInputCommandInteraction,
  ctx: TraceContext
): Promise<void> {
  const startedAt = Date.now();
  const l = log.ctx(ctx);

  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ flags: 64 });
  }

  l.event("end_requested", {
    guildId,
    userId,
  });

  if (!guildId) {
    await safeReply(interaction, "❌ Guild only command");
    return;
  }

  const session = QuickAddSession.get(guildId, userId);

  l.event("end_session_loaded", {
    sessionId: session?.sessionId,
    guildId,
    userId,
  });

  const contextError = validateQuickAddContext(
    interaction,
    session,
    ctx.traceId
  );

  const ownerError = validateSessionOwner(
    interaction,
    session,
    ctx.traceId
  );

  if (contextError || ownerError || !session) {
    l.warn("end_guard_failed", {
      sessionId: session?.sessionId,
      guildId,
      userId,
      hasSession: !!session,
      contextError,
      ownerError,
      reason:
        contextError ??
        ownerError ??
        (!session ? "no_session" : "unknown"),
    });

    await safeReply(
      interaction,
      contextError ?? ownerError ?? "❌ Session not found"
    );
    return;
  }

  const { sessionId, threadId, stage } = session;

  try {
    l.event("end_start", {
      sessionId,
      guildId,
      threadId,
      stage,
    });

    const entries = QuickAddBuffer.getEntries(sessionId, ctx.traceId);

    l.event("end_buffer_state", {
      sessionId,
      count: entries.length,
    });

    l.event("end_cleanup_start", {
      sessionId,
    });

    // 🧹 cleanup
    QuickAddBuffer.clear(sessionId, ctx.traceId);
    QuickAddSession.end(guildId, userId, ctx.traceId);

    await safeReply(
      interaction,
      "🛑 QuickAdd session ended"
    );

    // 🧵 delete thread (if possible)
    try {
      const channel = interaction.channel;

      if (
        channel &&
        typeof channel === "object" &&
        "deletable" in channel &&
        channel.deletable
      ) {
        await channel.delete();

        l.event("thread_deleted", {
          sessionId,
          guildId,
          threadId,
        });
      }
    } catch (err) {
      l.warn("thread_delete_failed", {
        sessionId,
        error: err,
      });
    }

    const duration = Date.now() - startedAt;

    l.event("end_done", {
      sessionId,
      durationMs: duration,
    });

  } catch (err) {
    const duration = Date.now() - startedAt;

    l.error("end_failed", {
      sessionId,
      durationMs: duration,
      error: err,
    });

    await safeReply(
      interaction,
      "❌ Failed to end session"
    );
  }
}