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
 */

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";

import { saveAdjusted } from "../../../storage/QuickAddRepository";

import { validateQuickAddContext } from "../../../rules/QuickAddGuards";
import { validateEntries } from "../../../validation/QuickAddValidator";

import { createLogger } from "../../../debug/DebugLogger";

const log = createLogger("CMD_ADJUST");

// =====================================
// 🚀 HANDLER
// =====================================

export async function handleAdjust(
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

  if (contextError) {
    await interaction.reply({
      content: contextError,
      ephemeral: true,
    });
    return;
  }

  // =====================================
  // 🔒 OWNER CHECK
  // =====================================
  if (session?.ownerId !== interaction.user.id) {
    await interaction.reply({
      content: "❌ Only session owner can use this command",
      ephemeral: true,
    });
    return;
  }

  // =====================================
  // 🔥 TRACE ID ENFORCEMENT
  // =====================================
  if (!session?.traceId) {
    throw new Error("Missing traceId in session");
  }

  const traceId = session.traceId;

  const id = interaction.options.getInteger("id", true);
  const newNickname = interaction.options.getString("nickname");
  const newValue = interaction.options.getInteger("value");

  try {
    // =====================================
    // 📥 LOAD BUFFER
    // =====================================
    const entries = QuickAddBuffer.getEntries(guildId);

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

    // =====================================
    // 🔁 APPLY CHANGE
    // =====================================
    const newEntries = [...entries];
    newEntries[index] = updated;

    // =====================================
    // 🔥 REVALIDATION (CRITICAL)
    // =====================================
    const revalidated = await validateEntries(
      newEntries.map((e) => ({
        nickname: e.nickname,
        value: e.value,
      })),
      traceId
    );

    // preserve IDs
    const merged = revalidated.map((v, i) => ({
      ...newEntries[i],
      status: v.status,
      confidence: v.confidence,
      suggestion: v.suggestion,
    }));

    QuickAddBuffer.setEntries(guildId, merged);

    log.trace("adjust_applied", traceId, {
      id,
      before: target,
      after: updated,
    });

    // =====================================
    // 💾 SAVE LEARNING
    // =====================================
    try {
      if (newNickname && newNickname !== target.nickname) {
        await saveAdjusted([
          {
            ocr_raw: target.nickname,
            adjusted: newNickname,
          },
        ]);

        log.trace("learning_saved_adjust", traceId, {
          from: target.nickname,
          to: newNickname,
        });
      }
    } catch (err) {
      log.warn("learning_failed_adjust", traceId, {
        error: err,
      });
    }

    await interaction.reply({
      content: `✅ Updated entry [${id}]`,
      ephemeral: true,
    });

    log.trace("adjust_done", traceId, {
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