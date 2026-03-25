// =====================================
// 📁 src/quickadd/discord/actions/preview/preview.ts
// =====================================

/**
 * 👀 ROLE:
 * Displays current QuickAdd buffer preview.
 *
 * ❗ RULES:
 * - read-only
 * - requires valid traceId
 */

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";

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
  // 🔥 TRACE ID ENFORCEMENT
  // =====================================
  if (!session?.traceId) {
    throw new Error("Missing traceId in session");
  }

  const traceId = session.traceId;

  try {
    // =====================================
    // 📥 LOAD BUFFER
    // =====================================
    const entries = QuickAddBuffer.getEntries(guildId);

    log.trace("preview_requested", traceId, {
      guildId,
      count: entries.length,
    });

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

    log.trace("preview_done", traceId, {
      count: entries.length,
      durationMs: Date.now() - startedAt,
    });

  } catch (err) {
    log.error("preview_failed", err, traceId);

    await interaction.reply({
      content: "❌ Failed to generate preview",
      ephemeral: true,
    });
  }
}