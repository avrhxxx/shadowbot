// =====================================
// 📁 src/system/quickadd/discord/actions/confirm/confirm.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";
import {
  enqueuePoints,
  enqueueEvents,
} from "../../../storage/QuickAddRepository";

import {
  validateQuickAddContext,
  validateSessionOwner,
} from "../../../rules/QuickAddGuards";

import { QuickAddType } from "../../../core/QuickAddTypes";

import { logger } from "../../../../core/logger/log";

// =====================================
// 🧠 MODE RESOLVER
// =====================================

function resolveMode(type: QuickAddType): "points" | "events" {
  if (type === "DONATIONS_POINTS" || type === "DUEL_POINTS") {
    return "points";
  }
  return "events";
}

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

export async function handleConfirm(
  interaction: ChatInputCommandInteraction,
  traceId: string
): Promise<void> {
  const startTime = Date.now();

  const guildId = interaction.guildId;
  const userId = interaction.user.id;

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
    traceId
  );

  const ownerError = validateSessionOwner(
    interaction,
    session,
    traceId
  );

  if (contextError || ownerError || !session) {
    logger.emit({
      scope: "quickadd.confirm",
      event: "confirm_guard_failed",
      traceId,
      level: "warn",
      context: {
        sessionId: session?.sessionId,
        guildId,
        userId,
        hasSession: !!session,
        contextError,
        ownerError,
      },
      stats: {
        confirm_blocked: 1,
      },
    });

    await safeReply(
      interaction,
      contextError ?? ownerError ?? "❌ Session not found"
    );
    return;
  }

  const sessionId = session.sessionId;

  try {
    logger.emit({
      scope: "quickadd.confirm",
      event: "confirm_start",
      traceId,
      context: {
        sessionId,
        stage: session.stage,
        type: session.type,
      },
      stats: {
        confirm_started: 1,
      },
    });

    const entries = QuickAddBuffer.getEntries(sessionId, traceId);

    logger.emit({
      scope: "quickadd.confirm",
      event: "confirm_buffer_loaded",
      traceId,
      context: {
        sessionId,
        count: entries.length,
      },
    });

    if (!entries.length) {
      logger.emit({
        scope: "quickadd.confirm",
        event: "confirm_empty",
        traceId,
        context: { sessionId },
        stats: {
          confirm_empty: 1,
        },
      });

      await safeReply(interaction, "⚠️ Nothing to confirm");
      return;
    }

    const invalid = entries.filter((e) => e.status !== "OK");

    if (invalid.length > 0) {
      logger.emit({
        scope: "quickadd.confirm",
        event: "confirm_blocked_invalid",
        traceId,
        context: {
          sessionId,
          invalidCount: invalid.length,
        },
        stats: {
          confirm_blocked_invalid: 1,
        },
      });

      await safeReply(
        interaction,
        `❌ Cannot confirm. ${invalid.length} entries are not OK.`
      );
      return;
    }

    if (session.stage === "COLLECTING") {
      QuickAddSession.setStage(
        guildId,
        userId,
        "CONFIRM_PENDING",
        traceId
      );

      logger.emit({
        scope: "quickadd.confirm",
        event: "confirm_stage_entered",
        traceId,
        context: {
          sessionId,
          count: entries.length,
        },
      });

      await safeReply(
        interaction,
        "⚠️ Confirmation step started.\n\n" +
          "➡️ Now run:\n" +
          "`/q confirm target:<week/event>`\n\n" +
          "💡 Start typing in 'target' to see suggestions."
      );

      return;
    }

    if (session.stage !== "CONFIRM_PENDING") {
      logger.emit({
        scope: "quickadd.confirm",
        event: "confirm_blocked_stage",
        traceId,
        level: "warn",
        context: {
          sessionId,
          stage: session.stage,
        },
        stats: {
          confirm_blocked_stage: 1,
        },
      });

      await safeReply(interaction, "❌ Invalid session stage");
      return;
    }

    const target = interaction.options.getString("target");

    if (!target) {
      logger.emit({
        scope: "quickadd.confirm",
        event: "confirm_blocked_missing_target",
        traceId,
        level: "warn",
        context: {
          sessionId,
        },
        stats: {
          confirm_blocked_missing_target: 1,
        },
      });

      await safeReply(
        interaction,
        "❌ Missing target.\n\n" +
          "➡️ Use:\n" +
          "`/q confirm target:<week/event>`\n\n" +
          "💡 Autocomplete is enabled."
      );
      return;
    }

    const mode = resolveMode(session.type);

    logger.emit({
      scope: "quickadd.confirm",
      event: "confirm_submit",
      traceId,
      context: {
        sessionId,
        mode,
        count: entries.length,
        target,
      },
    });

    if (mode === "points") {
      await enqueuePoints(
        entries.map((e) => ({
          guildId,
          category: session.type,
          week: target,
          nickname: e.nickname,
          points: e.value,
        })),
        traceId
      );
    } else {
      await enqueueEvents(
        entries.map((e) => ({
          guildId,
          eventId: target,
          type: session.type,
          nickname: e.nickname,
        })),
        traceId
      );
    }

    logger.emit({
      scope: "quickadd.confirm",
      event: "confirm_cleanup",
      traceId,
      context: {
        sessionId,
      },
    });

    QuickAddBuffer.clear(sessionId, traceId);
    QuickAddSession.end(guildId, userId, traceId);

    await safeReply(
      interaction,
      `✅ Submitted ${entries.length} entries`
    );

    const duration = Date.now() - startTime;

    logger.emit({
      scope: "quickadd.confirm",
      event: "confirm_done",
      traceId,
      context: {
        sessionId,
        mode,
        count: entries.length,
      },
      meta: {
        durationMs: duration,
      },
      stats: {
        confirm_success: 1,
      },
    });

  } catch (err) {
    const duration = Date.now() - startTime;

    logger.emit({
      scope: "quickadd.confirm",
      event: "confirm_failed",
      traceId,
      level: "error",
      context: {
        sessionId,
      },
      meta: {
        durationMs: duration,
      },
      stats: {
        confirm_error: 1,
      },
      error: err,
    });

    await safeReply(
      interaction,
      "❌ Failed to confirm entries"
    );
  }
}