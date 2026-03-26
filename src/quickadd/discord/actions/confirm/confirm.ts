// =====================================
// 📁 src/quickadd/discord/actions/confirm/confirm.ts
// =====================================

/**
 * 🧠 ROLE:
 * Finalizes QuickAdd session (STRICT MODE).
 *
 * ❗ RULES:
 * - ALL entries must be OK
 * - owner only
 * - destructive (clears buffer)
 * - traceId MUST be injected (from router)
 * - NO traceId fallback (STRICT)
 * - sessionId included in logs
 */

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";
import { enqueuePoints } from "../../../storage/QuickAddRepository";
import { validateQuickAddContext } from "../../../rules/QuickAddGuards";

import { createScopedLogger } from "@/quickadd/debug/logger";

const log = createScopedLogger(import.meta.url);

// =====================================
// 🚀 HANDLER
// =====================================

export async function handleConfirm(
  interaction: ChatInputCommandInteraction,
  traceId: string
): Promise<void> {
  const startedAt = Date.now();

  const guildId = interaction.guildId;

  if (!guildId) {
    await interaction.reply({
      content: "❌ Guild only command",
      ephemeral: true,
    });
    return;
  }

  const session = QuickAddSession.get(guildId);

  const contextError = validateQuickAddContext(interaction, session);

  if (contextError || !session) {
    await interaction.reply({
      content: contextError ?? "❌ Session not found",
      ephemeral: true,
    });
    return;
  }

  if (session.ownerId !== interaction.user.id) {
    await interaction.reply({
      content: "❌ Only session owner can confirm",
      ephemeral: true,
    });
    return;
  }

  try {
    log.trace("confirm_start", traceId, {
      sessionId: session.sessionId,
      guildId,
      type: session.type,
    });

    // =====================================
    // 📥 LOAD BUFFER
    // =====================================
    const entries = QuickAddBuffer.getEntries(
      guildId,
      traceId
    );

    log.trace("buffer_loaded", traceId, {
      sessionId: session.sessionId,
      count: entries.length,
    });

    if (!entries.length) {
      await interaction.reply({
        content: "⚠️ Nothing to confirm",
        ephemeral: true,
      });
      return;
    }

    // =====================================
    // 🔴 STRICT VALIDATION
    // =====================================
    const invalid = entries.filter((e) => e.status !== "OK");

    log.trace("validation_check", traceId, {
      sessionId: session.sessionId,
      total: entries.length,
      invalid: invalid.length,
    });

    if (invalid.length > 0) {
      log.trace("confirm_blocked_non_ok", traceId, {
        sessionId: session.sessionId,
        invalid: invalid.length,
      });

      await interaction.reply({
        content: `❌ Cannot confirm. ${invalid.length} entries are not OK.`,
        ephemeral: true,
      });
      return;
    }

    // =====================================
    // 📤 BUILD PAYLOAD
    // =====================================
    const payload = entries.map((e) => ({
      guildId,
      category: session.type,
      week: "CURRENT",
      nickname: e.nickname,
      points: e.value,
    }));

    log.trace("queue_start", traceId, {
      sessionId: session.sessionId,
      count: payload.length,
    });

    // =====================================
    // 💾 QUEUE
    // =====================================
    await enqueuePoints(payload, traceId);

    log.trace("confirm_success", traceId, {
      sessionId: session.sessionId,
      total: entries.length,
    });

    // =====================================
    // 🧹 CLEAR BUFFER
    // =====================================
    QuickAddBuffer.clear(guildId, traceId);

    log.trace("buffer_cleared", traceId, {
      sessionId: session.sessionId,
      guildId,
    });

    await interaction.reply({
      content: `✅ Submitted ${entries.length} entries`,
      ephemeral: true,
    });

    log.trace("confirm_done", traceId, {
      sessionId: session.sessionId,
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