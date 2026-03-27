// =====================================
// 📁 src/quickadd/discord/actions/confirm/confirm.ts
// =====================================

/**
 * 🧠 ROLE:
 * Finalizes QuickAdd session (STRICT MODE).
 *
 * ❗ RULES:
 * - OK ONLY (block otherwise)
 * - branch by session.type
 * - uses autocomplete target (week / event)
 * - full cleanup after success
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

import { createScopedLogger } from "@/quickadd/debug/logger";

const log = createScopedLogger(import.meta.url);

// =====================================
// 🧠 MODE RESOLVER
// =====================================

function resolveMode(type: QuickAddType): "points" | "events" {
  if (type === "DONATIONS_POINTS" || type === "DUEL_POINTS") {
    return "points";
  }

  if (type === "RR_SIGNUPS" || type === "RR_RESULTS") {
    return "events";
  }

  throw new Error("Unknown QuickAddType");
}

// =====================================
// 🚀 HANDLER
// =====================================

export async function handleConfirm(
  interaction: ChatInputCommandInteraction,
  traceId: string
): Promise<void> {
  const startedAt = Date.now();

  const guildId = interaction.guildId;
  const userId = interaction.user.id;

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
      content: contextError ?? ownerError ?? "❌ Session not found",
      ephemeral: true,
    });
    return;
  }

  try {
    log.trace("confirm_start", traceId, {
      sessionId: session.sessionId,
      type: session.type,
    });

    // =====================================
    // 📥 BUFFER
    // =====================================

    const entries = QuickAddBuffer.getEntries(guildId, traceId);

    if (!entries.length) {
      await interaction.reply({
        content: "⚠️ Nothing to confirm",
        ephemeral: true,
      });
      return;
    }

    // =====================================
    // ❗ OK ONLY RULE
    // =====================================

    const invalid = entries.filter((e) => e.status !== "OK");

    if (invalid.length > 0) {
      await interaction.reply({
        content: `❌ Cannot confirm. ${invalid.length} entries are not OK.`,
        ephemeral: true,
      });
      return;
    }

    // =====================================
    // 🎯 TARGET (AUTOCOMPLETE VALUE)
    // =====================================

    const target =
      interaction.options.getString("week") ||
      interaction.options.getString("event");

    if (!target) {
      await interaction.reply({
        content: "❌ Missing target (week/event)",
        ephemeral: true,
      });
      return;
    }

    const mode = resolveMode(session.type);

    // =====================================
    // 🟦 POINTS
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

      log.trace("confirm_points_enqueued", traceId, {
        count: entries.length,
        week: target,
      });
    }

    // =====================================
    // 🟥 EVENTS
    // =====================================

    if (mode === "events") {
      await enqueueEvents(
        entries.map((e) => ({
          guildId,
          eventId: target,
          type: session.type,
          nickname: e.nickname,
        })),
        traceId
      );

      log.trace("confirm_events_enqueued", traceId, {
        count: entries.length,
        eventId: target,
      });
    }

    // =====================================
    // 🧹 CLEANUP
    // =====================================

    QuickAddBuffer.clear(guildId, traceId);
    QuickAddSession.end(guildId, traceId);

    // =====================================
    // 📤 RESPONSE
    // =====================================

    await interaction.reply({
      content: `✅ Submitted ${entries.length} entries`,
      ephemeral: true,
    });

    log.trace("confirm_done", traceId, {
      sessionId: session.sessionId,
      mode,
      durationMs: Date.now() - startedAt,
    });

  } catch (err) {
    log.error("confirm_failed", err, traceId);

    await interaction.reply({
      content: "❌ Failed to confirm entries",
      ephemeral: true,
    });
  }
}