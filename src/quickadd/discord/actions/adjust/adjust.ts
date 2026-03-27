// =====================================
// 📁 src/quickadd/discord/actions/adjust/adjust.ts
// =====================================

/**
 * ✏️ ROLE:
 * Adjust entry + REVALIDATE buffer
 *
 * ❗ RULES:
 * - owner only
 * - revalidation required
 * - traceId MUST be injected (from router)
 * - NO traceId fallback (STRICT)
 * - sessionId included in logs
 */

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";

import { saveAdjusted } from "../../../storage/QuickAddRepository";

import { validateQuickAddContext } from "../../../rules/QuickAddGuards";
import { validateEntries } from "../../../validation/QuickAddValidator";

import { createScopedLogger } from "@/quickadd/debug/logger";

const log = createScopedLogger(import.meta.url);

// =====================================
// 🚀 HANDLER
// =====================================

export async function handleAdjust(
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
      content: "❌ Only session owner can use this command",
      ephemeral: true,
    });
    return;
  }

  const id = interaction.options.getInteger("id", true);
  const newNickname = interaction.options.getString("nickname");
  const newValue = interaction.options.getInteger("value");

  try {
    log.trace("adjust_start", traceId, {
      sessionId: session.sessionId,
      guildId,
      id,
      newNickname,
      newValue,
    });

    const entries = QuickAddBuffer.getEntries(guildId, traceId);

    const index = entries.findIndex((e) => e.id === id);

    if (index === -1) {
      await interaction.reply({
        content: `❌ Entry with ID ${id} not found`,
        ephemeral: true,
      });
      return;
    }

    const target = entries[index];

    const updated = {
      ...target,
      nickname: newNickname ?? target.nickname,
      value: newValue ?? target.value,
    };

    const newEntries = [...entries];
    newEntries[index] = updated;

    const revalidated = await validateEntries(
      newEntries.map((e) => ({
        nickname: e.nickname,
        value: e.value,
      })),
      traceId
    );

    const merged = revalidated.map((v, i) => ({
      ...newEntries[i],
      status: v.status,
      confidence: v.confidence,
      suggestion: v.suggestion,
    }));

    QuickAddBuffer.setEntries(guildId, merged, traceId);

    log.trace("adjust_applied", traceId, {
      sessionId: session.sessionId,
      id,
      before: target,
      after: updated,
    });

    try {
      if (newNickname && newNickname !== target.nickname) {
        await saveAdjusted(
          [
            {
              ocr_raw: target.nickname,
              adjusted: newNickname,
            },
          ],
          traceId
        );

        log.trace("learning_saved_adjust", traceId, {
          sessionId: session.sessionId,
          from: target.nickname,
          to: newNickname,
        });
      }
    } catch (err) {
      log.warn("learning_failed_adjust", traceId, {
        sessionId: session.sessionId,
        error: err,
      });
    }

    await interaction.reply({
      content: `✅ Updated entry [${id}]`,
      ephemeral: true,
    });

    log.trace("adjust_done", traceId, {
      sessionId: session.sessionId,
      durationMs: Date.now() - startedAt,
    });

  } catch (err) {
    log.error("adjust_failed", err, traceId);

    await interaction.reply({
      content: "❌ Failed to adjust entry",
      ephemeral: true,
    });
  }
}