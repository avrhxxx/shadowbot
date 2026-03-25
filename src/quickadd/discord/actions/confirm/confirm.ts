// =====================================
// 📁 src/quickadd/discord/actions/confirm/confirm.ts
// =====================================

/**
 * ✅ ROLE:
 * Finalizes QuickAdd session and sends data to queue.
 *
 * Responsible for:
 * - validating session + context
 * - validating entries (final filter)
 * - pushing to queue (Google Sheets)
 * - clearing buffer
 *
 * ❗ RULES:
 * - ONLY valid entries go to queue
 * - destructive operation (clears buffer)
 * - final stage of pipeline
 */

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";
import { enqueuePoints } from "../../../storage/QuickAddRepository"; // ✅ FIX
import { validateQuickAddContext } from "../../../rules/QuickAddGuards";

import { createLogger } from "../../../debug/DebugLogger";

const log = createLogger("CMD_CONFIRM");

// =====================================
// 🚀 HANDLER
// =====================================

export async function handleConfirm(
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

  if (contextError || !session) { // ✅ FIX (safety)
    await interaction.reply({
      content: contextError ?? "❌ Session not found",
      ephemeral: true,
    });
    return;
  }

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
    // 🔍 FILTER VALID ENTRIES
    // =====================================
    const validEntries = entries.filter(
      (e) =>
        e.status === "OK" ||
        e.status === "LOW_CONFIDENCE"
    );

    if (!validEntries.length) {
      await interaction.reply({
        content: "❌ No valid entries to submit",
        ephemeral: true,
      });
      return;
    }

    // =====================================
    // 📤 BUILD QUEUE PAYLOAD
    // =====================================
    const payload = validEntries.map((e) => ({
      guildId,
      category: session.type, // ✅ FIX (no !)
      week: "CURRENT", // 🔥 TODO: replace later
      nickname: e.nickname,
      points: e.value,
    }));

    // =====================================
    // 💾 SEND TO QUEUE
    // =====================================
    await enqueuePoints(payload);

    // ✅ FIX — trace requires traceId
    log.trace(
      "confirm_success",
      session.traceId,
      {
        total: entries.length,
        valid: validEntries.length,
      }
    );

    // =====================================
    // 🧹 CLEAR BUFFER
    // =====================================
    QuickAddBuffer.clear(guildId);

    // =====================================
    // 📤 RESPONSE
    // =====================================
    await interaction.reply({
      content: `✅ Submitted ${validEntries.length} entries`,
      ephemeral: true,
    });

  } catch (err) {
    log.error("confirm_failed", err);

    await interaction.reply({
      content: "❌ Failed to confirm entries",
      ephemeral: true,
    });
  }
}

/**
 * =====================================
 * ✅ CHANGES (INDEX)
 * =====================================
 *
 * 1. 🔥 FIXED LOGGER:
 *    - log.trace now includes traceId
 *    - required signature: (event, traceId, data)
 *
 * 2. 🧠 traceId source:
 *    - session.traceId (safe because session validated above)
 *
 * ✔ File now aligned with:
 *    - DebugLogger contract
 *    - global logging standard
 */