// =====================================
// 📁 src/quickadd/discord/actions/preview/preview.ts
// =====================================

/**
 * 👀 ROLE:
 * Displays current QuickAdd buffer preview.
 *
 * ❗ RULES:
 * - read-only (NO mutations)
 * - traceId MUST be injected (STRICT)
 * - sessionId included in logs
 * - CJS SAFE
 *
 * ✅ FINAL:
 * - safe buffer read
 * - empty state handling
 * - deterministic output
 */

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";

import { formatPreview } from "../../../utils/PreviewFormatter";

import { validateQuickAddContext } from "../../../rules/QuickAddGuards";

import { createScopedLogger } from "../../../debug/logger";

// ❗ CJS SAFE
const log = createScopedLogger(__filename);

// =====================================
// 🚀 HANDLER
// =====================================

export async function handlePreview(
  interaction: ChatInputCommandInteraction,
  traceId: string
): Promise<void> {
  const startedAt = Date.now();

  const guildId = interaction.guildId;

  // =====================================
  // ❌ GUILD GUARD
  // =====================================
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

  try {
    // =====================================
    // 📥 LOAD BUFFER
    // =====================================
    const entries = QuickAddBuffer.getEntries(
      guildId,
      traceId
    );

    log.trace("preview_requested", traceId, {
      sessionId: session.sessionId,
      guildId,
      count: entries.length,
    });

    // =====================================
    // ⚠️ EMPTY STATE
    // =====================================
    if (!entries.length) {
      await interaction.reply({
        content: "⚠️ Buffer is empty",
        ephemeral: true,
      });

      log.trace("preview_empty", traceId, {
        sessionId: session.sessionId,
      });

      return;
    }

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
      sessionId: session.sessionId,
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