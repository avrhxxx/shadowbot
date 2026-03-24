// =====================================
// 📁 src/quickadd/discord/actions/adjust/adjust.ts
// =====================================

/**
 * ✏️ ROLE:
 * Manually adjusts a single entry in buffer.
 *
 * Responsible for:
 * - validating session + context
 * - updating entry (nickname/value)
 * - persisting learning (Google Sheets)
 *
 * ❗ RULES:
 * - minimal business logic
 * - mutation only on buffer layer
 * - learning write is side-effect
 */

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";
import { saveAdjusted } from "../../../storage/QuickAddService";
import { validateQuickAddContext } from "../../../rules/QuickAddGuards";

import { createLogger } from "../../../debug/DebugLogger";

const log = createLogger("CMD_ADJUST");

// =====================================
// 🚀 HANDLER
// =====================================

export async function handleAdjust(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const guildId = interaction.guildId;

  if (!guildId) {
    await interaction.reply({
      content: "❌ Guild only command",
      ephemeral: true,
    });
    return;
  }

  const session = QuickAddSession.get(guildId);

  // =====================================
  // 🔒 VALIDATION
  // =====================================
  const contextError = validateQuickAddContext(interaction, session);

  if (contextError) {
    await interaction.reply({
      content: contextError,
      ephemeral: true,
    });
    return;
  }

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
    // 🔁 UPDATE BUFFER (IMMUTABLE)
    // =====================================
    const newEntries = [...entries];
    newEntries[index] = updated;

    QuickAddBuffer.setEntries(guildId, newEntries);

    log("adjust_applied", {
      id,
      before: target,
      after: updated,
    });

    // =====================================
    // 💾 SAVE LEARNING (ASYNC SIDE EFFECT)
    // =====================================
    try {
      if (newNickname && newNickname !== target.nickname) {
        await saveAdjusted([
          {
            ocr_raw: target.nickname,
            adjusted: newNickname,
          },
        ]);

        log("learning_saved_adjust", {
          from: target.nickname,
          to: newNickname,
        });
      }
    } catch (err) {
      log.warn("learning_failed_adjust", err);
    }

    // =====================================
    // 📤 RESPONSE
    // =====================================
    await interaction.reply({
      content: `✅ Updated entry [${id}]`,
      ephemeral: true,
    });

  } catch (err) {
    log.error("adjust_failed", err);

    await interaction.reply({
      content: "❌ Failed to adjust entry",
      ephemeral: true,
    });
  }
}