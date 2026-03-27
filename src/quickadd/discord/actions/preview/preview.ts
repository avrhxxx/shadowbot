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
  const userId = interaction.user.id;

  // =====================================
  // ❌ GUILD GUARD
  // =====================================
  if (!guildId) {
    await interaction.editReply("❌ Guild only command");
    return;
  }

  const session = QuickAddSession.get(guildId, userId);

  const contextError = validateQuickAddContext(
    interaction,
    session,
    traceId
  );

  if (contextError || !session) {
    await interaction.editReply(
      contextError ?? "❌ Session not found"
    );
    return;
  }

  const sessionId = session.sessionId;

  try {
    metrics.increment("preview_requested");

    // =====================================
    // 📥 LOAD BUFFER (🔥 FIX)
    // =====================================
    const entries = QuickAddBuffer.getEntries(
      sessionId,
      traceId
    );

    log.emit({
      event: "preview_requested",
      traceId,
      data: {
        sessionId,
        guildId,
        count: entries.length,
      },
    });

    // =====================================
    // ⚠️ EMPTY STATE
    // =====================================
    if (!entries.length) {
      await interaction.editReply("⚠️ Buffer is empty");

      metrics.increment("preview_empty");

      log.emit({
        event: "preview_empty",
        traceId,
        data: {
          sessionId,
        },
      });

      return;
    }

    // =====================================
    // 🖥️ FORMAT OUTPUT
    // =====================================
    const output = formatPreview(entries, traceId);

    // =====================================
    // 📤 RESPONSE
    // =====================================
    await interaction.editReply(output);

    const duration = timing.end(timerId);

    metrics.increment("preview_success");

    log.emit({
      event: "preview_done",
      traceId,
      data: {
        sessionId,
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

    await interaction.editReply(
      "❌ Failed to generate preview"
    );
  }
}