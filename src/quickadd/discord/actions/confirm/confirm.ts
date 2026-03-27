// =====================================
// 📁 src/quickadd/discord/actions/confirm/confirm.ts
// =====================================

/**
 * 🧠 ROLE:
 * Finalizes QuickAdd session (STRICT MODE).
 *
 * ❗ RULES:
 * - OK ONLY
 * - 2-stage flow
 * - owner only
 * - traceId injected
 *
 * ✅ FINAL:
 * - log.emit only (no scoped logger)
 * - full observability (metrics + timing)
 * - zero logger coupling
 */

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
// 🚀 HANDLER
// =====================================

export async function handleConfirm(
  interaction: ChatInputCommandInteraction,
  traceId: string
): Promise<void> {
  const timerId = `confirm-${traceId}`;
  timing.start(timerId);

  const guildId = interaction.guildId;

  if (!guildId) {
    await interaction.reply({
      content: "❌ Guild only command",
      ephemeral: true,
    });
    return;
  }

  const session = QuickAddSession.get(guildId);

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
    metrics.increment("confirm_started");

    log.emit({
      event: "confirm_start",
      traceId,
      data: {
        sessionId: session.sessionId,
        stage: session.stage,
        type: session.type,
      },
    });

    const entries = QuickAddBuffer.getEntries(guildId, traceId);

    if (!entries.length) {
      await interaction.reply({
        content: "⚠️ Nothing to confirm",
        ephemeral: true,
      });
      return;
    }

    const invalid = entries.filter((e) => e.status !== "OK");

    if (invalid.length > 0) {
      metrics.increment("confirm_blocked_invalid");

      await interaction.reply({
        content: `❌ Cannot confirm. ${invalid.length} entries are not OK.`,
        ephemeral: true,
      });
      return;
    }

    // =============================
    // STAGE 1
    // =============================

    if (session.stage === "COLLECTING") {
      QuickAddSession.setStage(
        guildId,
        "CONFIRM_PENDING",
        traceId
      );

      await interaction.reply({
        content:
          "⚠️ Confirmation step started.\n\n" +
          "➡️ Now run:\n" +
          "`/q confirm target:<week/event>`\n\n" +
          "💡 Start typing in 'target' to see suggestions.",
        ephemeral: true,
      });

      log.emit({
        event: "confirm_stage_entered",
        traceId,
        data: {
          sessionId: session.sessionId,
        },
      });

      return;
    }

    // =============================
    // STAGE GUARD
    // =============================

    if (session.stage !== "CONFIRM_PENDING") {
      await interaction.reply({
        content: "❌ Invalid session stage",
        ephemeral: true,
      });
      return;
    }

    // =============================
    // STAGE 2
    // =============================

    const target = interaction.options.getString("target");

    if (!target) {
      await interaction.reply({
        content:
          "❌ Missing target.\n\n" +
          "➡️ Use:\n" +
          "`/q confirm target:<week/event>`\n\n" +
          "💡 Autocomplete is enabled.",
        ephemeral: true,
      });
      return;
    }

    const mode = resolveMode(session.type);

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

    QuickAddBuffer.clear(guildId, traceId);
    QuickAddSession.end(guildId, traceId);

    await interaction.reply({
      content: `✅ Submitted ${entries.length} entries`,
      ephemeral: true,
    });

    const duration = timing.end(timerId);

    metrics.increment("confirm_success");

    log.emit({
      event: "confirm_done",
      traceId,
      data: {
        sessionId: session.sessionId,
        durationMs: duration,
      },
    });

  } catch (err) {
    const duration = timing.end(timerId);

    metrics.increment("confirm_error");

    log.emit({
      event: "confirm_failed",
      traceId,
      level: "error",
      data: {
        error: err,
        durationMs: duration,
      },
    });

    await interaction.reply({
      content: "❌ Failed to confirm entries",
      ephemeral: true,
    });
  }
}