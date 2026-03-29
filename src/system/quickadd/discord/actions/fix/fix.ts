// =====================================
// 📁 src/system/quickadd/discord/actions/fix/fix.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";

import { validateQuickAddContext } from "../../../rules/QuickAddGuards";
import { validateEntries } from "../../../validation/QuickAddValidator";

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

export async function handleFix(
  interaction: ChatInputCommandInteraction,
  ctx: TraceContext
): Promise<void> {
  const startTime = Date.now();
  const l = log.ctx(ctx);

  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ flags: 64 });
  }

  l.event("fix_requested", {
    guildId,
    userId,
  });

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

  if (contextError || !session) {
    l.warn("fix_guard_failed", {
      sessionId: session?.sessionId,
      guildId,
      userId,
      hasSession: !!session,
      contextError,
      reason:
        contextError ??
        (!session ? "no_session" : "unknown"),
    });

    await safeReply(
      interaction,
      contextError ?? "❌ Session not found"
    );
    return;
  }

  const sessionId = session.sessionId;

  try {
    l.event("fix_start", {
      sessionId,
      guildId,
      stage: session.stage,
    });

    const entries = QuickAddBuffer.getEntries(sessionId, ctx.traceId);

    l.event("fix_buffer_loaded", {
      sessionId,
      count: entries.length,
    });

    if (!entries.length) {
      l.event("fix_empty", {
        sessionId,
      });

      await safeReply(interaction, "⚠️ Nothing to fix");
      return;
    }

    let applied = 0;
    const changes: { from: string; to: string }[] = [];

    const updatedRaw = entries.map((entry) => {
      if (
        entry.suggestion &&
        entry.suggestion !== entry.nickname
      ) {
        applied++;
        changes.push({
          from: entry.nickname,
          to: entry.suggestion,
        });

        return {
          ...entry,
          nickname: entry.suggestion,
        };
      }
      return entry;
    });

    l.event("fix_revalidation_start", {
      sessionId,
      count: updatedRaw.length,
    });

    const revalidated = await validateEntries(
      updatedRaw.map((e) => ({
        nickname: e.nickname,
        value: e.value,
      })),
      ctx.traceId
    );

    l.event("fix_revalidation_done", {
      sessionId,
      count: revalidated.length,
    });

    if (revalidated.length !== updatedRaw.length) {
      l.warn("revalidation_length_mismatch", {
        sessionId,
        before: updatedRaw.length,
        after: revalidated.length,
      });

      await safeReply(
        interaction,
        "❌ Internal error (revalidation mismatch)"
      );
      return;
    }

    const merged = revalidated.map((v, i) => ({
      ...updatedRaw[i],
      status: v.status,
      confidence: v.confidence,
      suggestion: v.suggestion,
    }));

    QuickAddBuffer.replaceEntries(sessionId, merged, ctx.traceId);

    if (applied === 0) {
      l.event("fix_no_changes", {
        sessionId,
      });
    }

    await safeReply(
      interaction,
      applied > 0
        ? `🤖 Fixed ${applied} entries automatically`
        : "⚠️ No entries to fix"
    );

    const duration = Date.now() - startTime;

    l.event("fix_done", {
      sessionId,
      applied,
      durationMs: duration,
      preview: changes.slice(0, 5),
    });

  } catch (err) {
    const duration = Date.now() - startTime;

    l.error("fix_failed", {
      sessionId,
      durationMs: duration,
      error: err,
    });

    await safeReply(
      interaction,
      "❌ Failed to apply fixes"
    );
  }
}