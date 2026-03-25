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

// ✅ FIX — use correct function export (no class)
import { saveAdjusted } from "../../../storage/QuickAddRepository";

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

    // ✅ FIX — trace requires traceId
    log.trace("adjust_applied", session?.traceId || "no-trace", {
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

        log.trace("learning_saved_adjust", session?.traceId || "no-trace", {
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

/**
 * =====================================
 * ✅ CHANGES (INDEX)
 * =====================================
 *
 * 1. ❌ Removed invalid import:
 *    - QuickAddRepository (class does not exist)
 *
 * 2. ✅ Correct import:
 *    - saveAdjusted (function export)
 *
 * 3. ❌ Fixed wrong function name:
 *    - saveAdjustments → saveAdjusted
 *
 * 4. 🔥 FIXED LOGGER:
 *    - log.trace now includes traceId:
 *      log.trace(event, traceId, data)
 *
 * 5. 🧠 traceId source:
 *    - session?.traceId fallback to "no-trace"
 *
 * ✔ File now aligned with:
 *    - storage layer (repository functions)
 *    - logger contract
 *    - architecture rules
 */