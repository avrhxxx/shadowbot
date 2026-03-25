// =====================================
// 📁 src/quickadd/discord/actions/confirm/confirm.ts
// =====================================

/**
 * ✅ ROLE:
 * Finalizes QuickAdd session (STRICT MODE).
 *
 * ❗ RULES:
 * - ALL entries must be OK
 * - owner only
 * - destructive (clears buffer)
 */

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";
import { enqueuePoints } from "../../../storage/QuickAddRepository";
import { validateQuickAddContext } from "../../../rules/QuickAddGuards";

import { createLogger } from "../../../debug/DebugLogger";

const log = createLogger("CMD_CONFIRM");

// =====================================
// 🚀 HANDLER
// =====================================

export async function handleConfirm(
  interaction: ChatInputCommandInteraction
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

  // =====================================
  // 🔒 OWNER CHECK
  // =====================================
  if (session.ownerId !== interaction.user.id) {
    await interaction.reply({
      content: "❌ Only session owner can confirm",
      ephemeral: true,
    });
    return;
  }

  // =====================================
  // 🔥 TRACE ID ENFORCEMENT
  // =====================================
  if (!session.traceId) {
    throw new Error("Missing traceId in session");
  }

  const traceId = session.traceId;

  try {
    // =====================================
    // 📥 LOAD BUFFER
    // =====================================
    const entries = QuickAddBuffer.getEntries(guildId);

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

    if (invalid.length > 0) {
      log.trace("confirm_blocked_non_ok", traceId, {
        total: entries.length,
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

    // =====================================
    // 💾 QUEUE
    // =====================================
    await enqueuePoints(payload);

    log.trace("confirm_success", traceId, {
      total: entries.length,
    });

    // =====================================
    // 🧹 CLEAR BUFFER
    // =====================================
    QuickAddBuffer.clear(guildId);

    await interaction.reply({
      content: `✅ Submitted ${entries.length} entries`,
      ephemeral: true,
    });

    log.trace("confirm_done", traceId, {
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