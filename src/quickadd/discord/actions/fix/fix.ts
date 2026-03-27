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
 * - sessionId included in logs
 * - CJS SAFE
 *
 * ✅ FINAL:
 * - safe merge after revalidation
 * - length mismatch guard
 * - deterministic behavior
 */

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";

import { validateQuickAddContext } from "../../../rules/QuickAddGuards";
import { validateEntries } from "../../../validation/QuickAddValidator";

import { createScopedLogger } from "../../../debug/logger";

// ❗ CJS SAFE
const log = createScopedLogger(__filename);

// =====================================
// 🚀 HANDLER
// =====================================

export async function handleFix(
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

  const contextError = validateQuickAddContext(interaction, session);

  if (contextError || !session) {
    await interaction.reply({
      content: contextError ?? "❌ Session not found",
      ephemeral: true,
    });
    return;
  }

  try {
    log.trace("fix_start", traceId, {
      sessionId: session.sessionId,
      guildId,
    });

    const entries = QuickAddBuffer.getEntries(guildId, traceId);

    if (!entries.length) {
      await interaction.reply({
        content: "⚠️ Nothing to fix",
        ephemeral: true,
      });
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
      log.warn("revalidation_length_mismatch", traceId, {
        sessionId: session.sessionId,
        before: updatedRaw.length,
        after: revalidated.length,
      });

      await interaction.reply({
        content: "❌ Internal error (revalidation mismatch)",
        ephemeral: true,
      });
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

    QuickAddBuffer.setEntries(guildId, merged, traceId);

    // =====================================
    // 📤 RESPONSE
    // =====================================

    await interaction.reply({
      content:
        applied > 0
          ? `🤖 Fixed ${applied} entries automatically`
          : "⚠️ No entries to fix",
      ephemeral: true,
    });

    log.trace("fix_done", traceId, {
      sessionId: session.sessionId,
      applied,
      durationMs: Date.now() - startedAt,
    });

  } catch (err) {
    log.error("fix_failed", err, traceId);

    await interaction.reply({
      content: "❌ Failed to apply fixes",
      ephemeral: true,
    });
  }
}