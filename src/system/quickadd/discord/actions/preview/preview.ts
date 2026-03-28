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
// 🔐 SAFE REPLY
// =====================================

async function safeReply(
  interaction: ChatInputCommandInteraction,
  content: string
) {
  try {
    await interaction.editReply(content);
  } catch {
    if (!interaction.replied) {
      await interaction
        .reply({ content, flags: 64 })
        .catch(() => null);
    }
  }
}

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

  // 🔥 REQUIRED (lifecycle fix)
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ flags: 64 });
  }

  // =====================================
  // 📥 ENTRY LOG
  // =====================================

  log.emit({
    event: "preview_requested_entry",
    traceId,
    data: {
      guildId,
      userId,
    },
  });

  // =====================================
  // ❌ GUILD GUARD
  // =====================================
  if (!guildId) {
    await safeReply(interaction, "❌ Guild only command");
    return;
  }

  const session = QuickAddSession.get(guildId, userId);

  const contextError = validateQuickAddContext(
    interaction,
    session,
    traceId
  );

  if (contextError || !session) {
    log.emit({
      event: "preview_guard_failed",
      traceId,
      level: "warn",
      data: {
        guildId,
        userId,
        hasSession: !!session,
        contextError,
      },
    });

    await safeReply(
      interaction,
      contextError ?? "❌ Session not found"
    );
    return;
  }

  const sessionId = session.sessionId;

  try {
    metrics.increment("preview_requested");

    // =====================================
    // 📥 LOAD BUFFER
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
      metrics.increment("preview_empty");

      log.emit({
        event: "preview_empty",
        traceId,
        data: {
          sessionId,
        },
      });

      await safeReply(interaction, "⚠️ Buffer is empty");
      return;
    }

    // =====================================
    // 🖥️ FORMAT OUTPUT
    // =====================================
    const output = formatPreview(entries, traceId);

    // =====================================
    // 📤 RESPONSE
    // =====================================
    await safeReply(interaction, output);

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

    await safeReply(
      interaction,
      "❌ Failed to generate preview"
    );
  }
}