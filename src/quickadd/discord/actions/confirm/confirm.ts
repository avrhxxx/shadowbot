// =====================================
// 📁 src/quickadd/discord/actions/confirm/confirm.ts
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

import { log, metrics, timing } from "../../../logger";

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
  const timerId = `confirm-${traceId}`;
  timing.start(timerId);

  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  // 🔥 REQUIRED
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
    log.emit({
      event: "confirm_guard_failed",
      traceId,
      type: "user",
      level: "warn",
      data: {
        guildId,
        userId,
        hasSession: !!session,
        contextError,
        ownerError,
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
    metrics.increment("confirm_started");

    log.emit({
      event: "confirm_start",
      traceId,
      type: "user",
      data: {
        sessionId,
        stage: session.stage,
        type: session.type,
      },
    });

    // =====================================
    // 📥 LOAD BUFFER
    // =====================================
    const entries = QuickAddBuffer.getEntries(sessionId, traceId);

    if (!entries.length) {
      log.emit({
        event: "confirm_empty",
        traceId,
        type: "user",
        data: { sessionId },
      });

      await safeReply(interaction, "⚠️ Nothing to confirm");
      return;
    }

    const invalid = entries.filter((e) => e.status !== "OK");

    if (invalid.length > 0) {
      metrics.increment("confirm_blocked_invalid");

      log.emit({
        event: "confirm_blocked_invalid",
        traceId,
        type: "user",
        data: {
          sessionId,
          invalidCount: invalid.length,
        },
      });

      await safeReply(
        interaction,
        `❌ Cannot confirm. ${invalid.length} entries are not OK.`
      );
      return;
    }

    // =============================
    // STAGE 1
    // =============================

    if (session.stage === "COLLECTING") {
      QuickAddSession.setStage(
        guildId,
        userId,
        "CONFIRM_PENDING",
        traceId
      );

      log.emit({
        event: "confirm_stage_entered",
        traceId,
        type: "user",
        data: {
          sessionId,
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

    // =============================
    // STAGE GUARD
    // =============================

    if (session.stage !== "CONFIRM_PENDING") {
      log.emit({
        event: "confirm_blocked_stage",
        traceId,
        type: "user",
        level: "warn",
        data: {
          sessionId,
          stage: session.stage,
        },
      });

      await safeReply(interaction, "❌ Invalid session stage");
      return;
    }

    // =============================
    // STAGE 2
    // =============================

    const target = interaction.options.getString("target");

    if (!target) {
      log.emit({
        event: "confirm_blocked_missing_target",
        traceId,
        type: "user",
        level: "warn",
        data: {
          sessionId,
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

    // =====================================
    // 📤 SUBMIT
    // =====================================

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

    // =====================================
    // 🧹 CLEANUP
    // =====================================

    QuickAddBuffer.clear(sessionId, traceId);
    QuickAddSession.end(guildId, userId, traceId);

    await safeReply(
      interaction,
      `✅ Submitted ${entries.length} entries`
    );

    const duration = timing.end(timerId);

    metrics.increment("confirm_success");

    log.emit({
      event: "confirm_done",
      traceId,
      type: "user",
      data: {
        sessionId,
        mode,
        count: entries.length,
        durationMs: duration,
      },
    });

  } catch (err) {
    const duration = timing.end(timerId);

    metrics.increment("confirm_error");

    log.emit({
      event: "confirm_failed",
      traceId,
      type: "user",
      level: "error",
      data: {
        sessionId,
        error: err,
        durationMs: duration,
      },
    });

    await safeReply(
      interaction,
      "❌ Failed to confirm entries"
    );
  }
}