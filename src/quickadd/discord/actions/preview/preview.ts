// =====================================
// 📁 src/quickadd/discord/actions/preview/preview.ts
// =====================================

/**
 * 👀 ROLE:
 * Displays current QuickAdd buffer preview.
 *
 * Responsible for:
 * - validating session + context
 * - fetching buffered entries
 * - formatting output
 *
 * ❗ RULES:
 * - NO mutations
 * - read-only operation
 */

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";

// ✅ FIX — correct file name
import { formatPreview } from "../../../utils/PreviewFormatter";

import {
  validateQuickAddContext,
} from "../../../rules/QuickAddGuards";

import { createLogger } from "../../../debug/DebugLogger";

const log = createLogger("CMD_PREVIEW");

// =====================================
// 🚀 HANDLER
// =====================================

export async function handlePreview(
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
  // 🔒 VALIDATION (SESSION + THREAD)
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

    // ✅ FIX — trace requires traceId
    log.trace(
      "preview_requested",
      session?.traceId || "no-trace",
      {
        guildId,
        count: entries.length,
      }
    );

    // =====================================
    // 🖥️ FORMAT OUTPUT
    // =====================================
    const output = formatPreview(entries);

    // =====================================
    // 📤 RESPONSE
    // =====================================
    await interaction.reply({
      content: output,
      ephemeral: true,
    });

  } catch (err) {
    log.error("preview_failed", err);

    await interaction.reply({
      content: "❌ Failed to generate preview",
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
 *    - session?.traceId fallback to "no-trace"
 *
 * ✔ File now aligned with:
 *    - DebugLogger contract
 *    - global logging standard
 */