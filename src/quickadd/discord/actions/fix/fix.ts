// =====================================
// 📁 src/quickadd/discord/actions/fix/fix.ts
// =====================================

/**
 * 🤖 ROLE:
 * Auto-fixes entries using validator suggestions.
 *
 * ❗ RULES:
 * - non-destructive (only suggestion-based overwrite)
 * - revalidation REQUIRED
 * - traceId MUST be injected
 * - NO traceId fallback
 *
 * ✅ FINAL:
 * - log.emit only (no scoped logger)
 * - safe merge after revalidation
 * - length mismatch guard
 * - deterministic behavior
 * - full observability (metrics + timing)
 */

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";

import { validateQuickAddContext } from "../../../rules/QuickAddGuards";
import { validateEntries } from "../../../validation/QuickAddValidator";

import { log, metrics, timing } from "../../../logger";

// =====================================
// 🔐 SAFE REPLY
// =====================================

async function safeReply(
  interaction: ChatInputCommandInteraction,
  content: string
) {
  if (!interaction.replied && !interaction.deferred) {
    await interaction.reply({ content, ephemeral: true });
  }
}

// =====================================
// 🚀 HANDLER
// =====================================

export async function handleFix(
  interaction: ChatInputCommandInteraction,
  traceId: string
): Promise<void> {
  const timerId = `fix-${traceId}`;
  timing.start(timerId);

  const guildId = interaction.guildId;
  const userId = interaction.user.id;

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
    await safeReply(
      interaction,
      contextError ?? "❌ Session not found"
    );
    return;
  }

  try {
    metrics.increment("fix_started");

    log.emit({
      event: "fix_start",
      traceId,
      data: {
        sessionId: session.sessionId,
        guildId,
      },
    });

    const entries = QuickAddBuffer.getEntries(guildId, traceId);

    if (!entries.length) {
      await safeReply(interaction, "⚠️ Nothing to fix");
      return;
    }

    let applied = 0;

    // =====================================
    // 🔧 APPLY SUGGESTIONS
    // =====================================

    const updatedRaw = entries.map((entry) => {
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
    // 🔁 REVALIDATION
    // =====================================

    const revalidated = await validateEntries(
      updatedRaw.map((e) => ({
        nickname: e.nickname,
        value: e.value,
      })),
      traceId
    );

    // =====================================
    // ⚠️ LENGTH GUARD
    // =====================================

    if (revalidated.length !== updatedRaw.length) {
      metrics.increment("fix_revalidation_mismatch");

      log.emit({
        event: "revalidation_length_mismatch",
        traceId,
        level: "warn",
        data: {
          sessionId: session.sessionId,
          before: updatedRaw.length,
          after: revalidated.length,
        },
      });

      await safeReply(
        interaction,
        "❌ Internal error (revalidation mismatch)"
      );
      return;
    }

    // =====================================
    // 🔗 MERGE RESULTS
    // =====================================

    const merged = revalidated.map((v, i) => ({
      ...updatedRaw[i],
      status: v.status,
      confidence: v.confidence,
      suggestion: v.suggestion,
    }));

    QuickAddBuffer.replaceEntries(guildId, merged, traceId);

    // =====================================
    // 📤 RESPONSE
    // =====================================

    await safeReply(
      interaction,
      applied > 0
        ? `🤖 Fixed ${applied} entries automatically`
        : "⚠️ No entries to fix"
    );

    const duration = timing.end(timerId);

    metrics.increment("fix_success");

    log.emit({
      event: "fix_done",
      traceId,
      data: {
        sessionId: session.sessionId,
        applied,
        durationMs: duration,
      },
    });

  } catch (err) {
    const duration = timing.end(timerId);

    metrics.increment("fix_error");

    log.emit({
      event: "fix_failed",
      traceId,
      level: "error",
      data: {
        error: err,
        durationMs: duration,
      },
    });

    await safeReply(
      interaction,
      "❌ Failed to apply fixes"
    );
  }
}