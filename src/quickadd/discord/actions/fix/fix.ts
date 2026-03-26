// =====================================
// 📁 src/quickadd/discord/actions/fix/fix.ts
// =====================================

/**
 * 🤖 ROLE:
 * Automatically fixes entries using validator suggestions.
 *
 * ❗ RULES:
 * - operates on buffer
 * - MUST revalidate after applying fixes
 * - traceId MUST be injected (from router)
 * - NO traceId fallback (STRICT)
 * - sessionId included in logs
 */

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";
import { validateQuickAddContext } from "../../../rules/QuickAddGuards";
import { validateEntries } from "../../../validation/QuickAddValidator";

import { createScopedLogger } from "@/quickadd/debug/logger";

const log = createScopedLogger(import.meta.url);

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

    // =====================================
    // 📥 LOAD BUFFER
    // =====================================
    const entries = QuickAddBuffer.getEntries(
      guildId,
      traceId
    );

    log.trace("buffer_loaded", traceId, {
      sessionId: session.sessionId,
      count: entries.length,
    });

    if (!entries.length) {
      await interaction.reply({
        content: "⚠️ Nothing to fix",
        ephemeral: true,
      });
      return;
    }

    let applied = 0;

    // =====================================
    // 🔁 APPLY FIXES
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

    log.trace("fix_applied_phase", traceId, {
      sessionId: session.sessionId,
      total: entries.length,
      fixed: applied,
    });

    // =====================================
    // 🔥 REVALIDATION
    // =====================================
    log.trace("revalidation_start", traceId, {
      sessionId: session.sessionId,
      count: updatedRaw.length,
    });

    const revalidated = await validateEntries(
      updatedRaw.map((e) => ({
        nickname: e.nickname,
        value: e.value,
      })),
      traceId
    );

    if (revalidated.length !== updatedRaw.length) {
      log.warn("revalidation_length_mismatch", {
        traceId,
        sessionId: session.sessionId,
        before: updatedRaw.length,
        after: revalidated.length,
      });
    }

    // =====================================
    // 🔗 MERGE (preserve IDs)
    // =====================================
    const merged = revalidated.map((v, i) => ({
      ...updatedRaw[i],
      status: v.status,
      confidence: v.confidence,
      suggestion: v.suggestion,
    }));

    // =====================================
    // 💾 SAVE BUFFER
    // =====================================
    QuickAddBuffer.setEntries(
      guildId,
      merged,
      traceId
    );

    log.trace("buffer_saved", traceId, {
      sessionId: session.sessionId,
      guildId,
      count: merged.length,
    });

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