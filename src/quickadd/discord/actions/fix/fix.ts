// =====================================
// 📁 src/quickadd/discord/actions/fix/fix.ts
// =====================================

/**
 * 🤖 ROLE:
 * Automatically fixes entries using validator suggestions.
 *
 * Responsible for:
 * - validating session + context
 * - applying suggestion → nickname
 * - updating buffer entries
 *
 * ❗ RULES:
 * - NO external calls (no sheets write)
 * - operates only on buffer
 * - uses validator output (suggestion + confidence)
 */

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";
import { validateQuickAddContext } from "../../../rules/QuickAddGuards";

import { createLogger } from "../../../debug/DebugLogger";

const log = createLogger("CMD_FIX");

// =====================================
// 🚀 HANDLER
// =====================================

export async function handleFix(
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

  try {
    // =====================================
    // 📥 LOAD BUFFER
    // =====================================
    const entries = QuickAddBuffer.getEntries(guildId);

    let applied = 0;

    // =====================================
    // 🔁 APPLY FIXES
    // =====================================
    const updated = entries.map((entry) => {
      if (
        entry.suggestion &&
        entry.suggestion !== entry.nickname
      ) {
        applied++;

        return {
          ...entry,
          nickname: entry.suggestion,
        };
      }

      return entry;
    });

    // =====================================
    // 💾 SAVE BUFFER
    // =====================================
    QuickAddBuffer.setEntries(guildId, updated);

    log("fix_applied", {
      guildId,
      total: entries.length,
      fixed: applied,
    });

    // =====================================
    // 📤 RESPONSE
    // =====================================
    await interaction.reply({
      content:
        applied > 0
          ? `🤖 Fixed ${applied} entries automatically`
          : "⚠️ No entries to fix",
      ephemeral: true,
    });

  } catch (err) {
    log.error("fix_failed", err);

    await interaction.reply({
      content: "❌ Failed to apply fixes",
      ephemeral: true,
    });
  }
}