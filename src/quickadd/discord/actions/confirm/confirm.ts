// =====================================
// 📁 src/quickadd/discord/actions/confirm/confirm.ts
// =====================================

/**
 * 🧠 ROLE:
 * Finalizes QuickAdd session (STRICT MODE).
 */

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";
import { enqueuePoints } from "../../../storage/QuickAddRepository";
import { validateQuickAddContext } from "../../../rules/QuickAddGuards";

import { createScopedLogger } from "@/quickadd/debug/logger";

const log = createScopedLogger(import.meta.url);

export async function handleConfirm(
  interaction: ChatInputCommandInteraction,
  traceId: string
): Promise<void> {
  const startedAt = Date.now();

  const guildId = interaction.guildId;

  if (!guildId) {
    await interaction.reply({ content: "❌ Guild only command", ephemeral: true });
    return;
  }

  const session = QuickAddSession.get(guildId);
  const contextError = validateQuickAddContext(interaction, session);

  if (contextError || !session) {
    await interaction.reply({ content: contextError ?? "❌ Session not found", ephemeral: true });
    return;
  }

  if (session.ownerId !== interaction.user.id) {
    await interaction.reply({ content: "❌ Only session owner can confirm", ephemeral: true });
    return;
  }

  try {
    log.trace("confirm_start", traceId, { sessionId: session.sessionId });

    const entries = QuickAddBuffer.getEntries(guildId, traceId);

    if (!entries.length) {
      await interaction.reply({ content: "⚠️ Nothing to confirm", ephemeral: true });
      return;
    }

    const invalid = entries.filter((e) => e.status !== "OK");

    if (invalid.length > 0) {
      await interaction.reply({
        content: `❌ Cannot confirm. ${invalid.length} entries are not OK.`,
        ephemeral: true,
      });
      return;
    }

    await enqueuePoints(
      entries.map((e) => ({
        guildId,
        category: session.type,
        week: "CURRENT",
        nickname: e.nickname,
        points: e.value,
      })),
      traceId
    );

    QuickAddBuffer.clear(guildId, traceId);

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