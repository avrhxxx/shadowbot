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
 * - traceId MUST be injected (from router)
 * - NO traceId fallback (STRICT)
 * - sessionId included in logs
 */

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";
import { validateQuickAddContext } from "../../../rules/QuickAddGuards";

import { createScopedLogger } from "@/quickadd/debug/logger";

const log = createScopedLogger(import.meta.url);

// =====================================
// 🚀 HANDLER
// =====================================

export async function handleCancel(
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

  // =====================================
  // 🔒 VALIDATION
  // =====================================
  const contextError = validateQuickAddContext(interaction, session);

  if (contextError || !session) {
    await interaction.reply({
      content: contextError ?? "❌ Session not found",
      ephemeral: true,
    });
    return;
  }

  try {
    log.trace("cancel_start", traceId, {
      sessionId: session.sessionId,
      guildId,
    });

    // =====================================
    // 🧹 CLEAR BUFFER
    // =====================================
    QuickAddBuffer.clear(guildId, traceId);

    log.trace("cancel_buffer_cleared", traceId, {
      sessionId: session.sessionId,
      guildId,
    });

    // =====================================
    // 📤 RESPONSE
    // =====================================
    await interaction.reply({
      content: "🧹 Buffer cleared (session still active)",
      ephemeral: true,
    });

    log.trace("cancel_done", traceId, {
      sessionId: session.sessionId,
      durationMs: Date.now() - startedAt,
    });

  } catch (err) {
    log.error("cancel_failed", err, traceId);

    await interaction.reply({
      content: "❌ Failed to clear buffer",
      ephemeral: true,
    });
  }
}