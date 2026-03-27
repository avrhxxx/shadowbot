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
 *
 * ✅ FINAL:
 * - log.emit only (no scoped logger)
 * - safe buffer read
 * - empty state handling
 * - deterministic output
 * - full observability (metrics + timing)
 */

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";

import { formatPreview } from "../../../utils/PreviewFormatter";

import { validateQuickAddContext } from "../../../rules/QuickAddGuards";

import { log, metrics, timing } from "../../../logger";

// =====================================
// 🚀 HANDLER
// =====================================

export async function handlePreview(
  interaction: ChatInputCommandInteraction,
  traceId: string
): Promise<void> {
  const timerId = `preview-${traceId}`;
  timing.start(timerId);

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

  const contextError = validateQuickAddContext(
    interaction,
    session,
    traceId
  );

  if (contextError || !session) {
    await interaction.reply({
      content: contextError ?? "❌ Session not found",
      ephemeral: true,
    });
    return;
  }

  try {
    metrics.increment("preview_requested");

    // =====================================
    // 📥 LOAD BUFFER
    // =====================================
    const entries = QuickAddBuffer.getEntries(
      guildId,
      traceId
    );

    log.emit({
      event: "preview_requested",
      traceId,
      data: {
        sessionId: session.sessionId,
        guildId,
        count: entries.length,
      },
    });

    // =====================================
    // ⚠️ EMPTY STATE
    // =====================================
    if (!entries.length) {
      await interaction.reply({
        content: "⚠️ Buffer is empty",
        ephemeral: true,
      });

      metrics.increment("preview_empty");

      log.emit({
        event: "preview_empty",
        traceId,
        data: {
          sessionId: session.sessionId,
        },
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

    const duration = timing.end(timerId);

    metrics.increment("preview_success");

    log.emit({
      event: "preview_done",
      traceId,
      data: {
        sessionId: session.sessionId,
        count: entries.length,
        durationMs: duration,
      },
    });

  } catch (err) {
    const duration = timing.end(timerId);

    metrics.increment("preview_error");

    log.emit({
      event: "preview_failed",
      traceId,
      level: "error",
      data: {
        error: err,
        durationMs: duration,
      },
    });

    await interaction.reply({
      content: "❌ Failed to generate preview",
      ephemeral: true,
    });
  }
}