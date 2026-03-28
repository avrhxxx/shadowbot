// =====================================
// 📁 src/system/quickadd/discord/actions/fix/fix.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";

import { validateQuickAddContext } from "../../../rules/QuickAddGuards";
import { validateEntries } from "../../../validation/QuickAddValidator";

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
  traceId: string
): Promise<void> {
  const startTime = Date.now();

  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ flags: 64 });
  }

  logger.emit({
    scope: "quickadd.fix",
    event: "fix_requested",
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

  if (contextError || !session) {
    logger.emit({
      scope: "quickadd.fix",
      event: "fix_guard_failed",
      traceId,
      level: "warn",
      context: {
        sessionId: session?.sessionId,
        guildId,
        userId,
        hasSession: !!session,
        contextError,
      },
      stats: {
        fix_blocked: 1,
      },
    });

    await safeReply(
      interaction,
      contextError ?? "❌ Session not found"
    );
    return;
  }

  const sessionId = session.sessionId;

  try {
    logger.emit({
      scope: "quickadd.fix",
      event: "fix_start",
      traceId,
      context: {
        sessionId,
        guildId,
        stage: session.stage,
      },
      stats: {
        fix_started: 1,
      },
    });

    const entries = QuickAddBuffer.getEntries(sessionId, traceId);

    logger.emit({
      scope: "quickadd.fix",
      event: "fix_buffer_loaded",
      traceId,
      context: {
        sessionId,
        count: entries.length,
      },
    });

    if (!entries.length) {
      logger.emit({
        scope: "quickadd.fix",
        event: "fix_empty",
        traceId,
        context: { sessionId },
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

    logger.emit({
      scope: "quickadd.fix",
      event: "fix_revalidation_start",
      traceId,
      context: {
        sessionId,
        count: updatedRaw.length,
      },
    });

    const revalidated = await validateEntries(
      updatedRaw.map((e) => ({
        nickname: e.nickname,
        value: e.value,
      })),
      traceId
    );

    logger.emit({
      scope: "quickadd.fix",
      event: "fix_revalidation_done",
      traceId,
      context: {
        sessionId,
        count: revalidated.length,
      },
    });

    if (revalidated.length !== updatedRaw.length) {
      logger.emit({
        scope: "quickadd.fix",
        event: "revalidation_length_mismatch",
        traceId,
        level: "warn",
        context: {
          sessionId,
          before: updatedRaw.length,
          after: revalidated.length,
        },
        stats: {
          fix_revalidation_mismatch: 1,
        },
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

    QuickAddBuffer.replaceEntries(sessionId, merged, traceId);

    if (applied === 0) {
      logger.emit({
        scope: "quickadd.fix",
        event: "fix_no_changes",
        traceId,
        context: {
          sessionId,
        },
        stats: {
          fix_no_changes: 1,
        },
      });
    }

    await safeReply(
      interaction,
      applied > 0
        ? `🤖 Fixed ${applied} entries automatically`
        : "⚠️ No entries to fix"
    );

    const duration = Date.now() - startTime;

    logger.emit({
      scope: "quickadd.fix",
      event: "fix_done",
      traceId,
      context: {
        sessionId,
        applied,
      },
      meta: {
        durationMs: duration,
        preview: changes.slice(0, 5),
      },
      stats: {
        fix_success: 1,
      },
    });

  } catch (err) {
    const duration = Date.now() - startTime;

    logger.emit({
      scope: "quickadd.fix",
      event: "fix_failed",
      traceId,
      level: "error",
      context: {
        sessionId,
      },
      meta: {
        durationMs: duration,
      },
      stats: {
        fix_error: 1,
      },
      error: err,
    });

    await safeReply(
      interaction,
      "❌ Failed to apply fixes"
    );
  }
}