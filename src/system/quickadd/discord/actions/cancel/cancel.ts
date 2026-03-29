// =====================================
// 📁 src/system/quickadd/discord/actions/cancel/cancel.ts
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

export async function handleCancel(
  interaction: ChatInputCommandInteraction,
  ctx: TraceContext
): Promise<void> {
  const startedAt = Date.now();
  const l = log.ctx(ctx);

  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  // 🔥 lifecycle fix (CRITICAL)
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ flags: 64 });
  }

  if (!guildId) {
    await safeReply(interaction, "❌ Guild only command");
    return;
  }

  const session = QuickAddSession.get(guildId, userId);

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
    l.warn("cancel_guard_failed", {
      guildId,
      userId,
      hasSession: !!session,
      contextError,
      ownerError,
    });

    await safeReply(
      interaction,
      contextError ?? ownerError ?? "❌ Session not found"
    );
    return;
  }

  const sessionId = session.sessionId;

  try {
    l.event("cancel_start", {
      sessionId,
      guildId,
      userId,
    });

    // =====================================
    // 🧹 CLEAR BUFFER (NOT ending session!)
    // =====================================
    QuickAddBuffer.clear(sessionId, ctx.traceId);

    l.event("cancel_buffer_cleared", {
      sessionId,
    });

    await safeReply(
      interaction,
      "🧹 Buffer cleared (session still active)"
    );

    const duration = Date.now() - startedAt;

    l.event("cancel_done", {
      sessionId,
      durationMs: duration,
    });

  } catch (err) {
    const duration = Date.now() - startedAt;

    l.error("cancel_failed", {
      sessionId,
      durationMs: duration,
      error: err,
    });

    await safeReply(
      interaction,
      "❌ Failed to clear buffer"
    );
  }
}