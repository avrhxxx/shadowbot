// =====================================
// 📁 src/quickadd/discord/actions/cancel/cancel.ts
// =====================================

/**
 * ❌ ROLE:
 * Clears current QuickAdd buffer WITHOUT ending session.
 *
 * Responsible for:
 * - validating session + context
 * - clearing buffer only
 *
 * ❗ RULES:
 * - DOES NOT end session
 * - DOES NOT send anything to queue
 * - user can continue flow after this
 *
 * 🔥 NOTE:
 * - traceId injected from CommandRouter
 * - fallback to session.traceId (temporary)
 */

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";
import { validateQuickAddContext } from "../../../rules/QuickAddGuards";

import { createLogger } from "../../../debug/DebugLogger";

const log = createLogger("CMD_CANCEL");

// =====================================
// 🚀 HANDLER
// =====================================

export async function handleCancel(
  interaction: ChatInputCommandInteraction,
  traceId?: string // 🔥 NEW
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

  // =====================================
  // 🔥 TRACE RESOLUTION
  // =====================================
  const resolvedTraceId = traceId || session?.traceId;

  if (!resolvedTraceId) {
    throw new Error("Missing traceId");
  }

  try {
    // =====================================
    // 🧹 CLEAR BUFFER ONLY
    // =====================================
    QuickAddBuffer.clear(guildId);

    log.trace("cancel_buffer_cleared", resolvedTraceId, {
      guildId,
    });

    // =====================================
    // 📤 RESPONSE
    // =====================================
    await interaction.reply({
      content: "🧹 Buffer cleared (session still active)",
      ephemeral: true,
    });

  } catch (err) {
    log.error("cancel_failed", err, resolvedTraceId);

    await interaction.reply({
      content: "❌ Failed to clear buffer",
      ephemeral: true,
    });
  }
}