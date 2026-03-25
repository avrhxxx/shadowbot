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
 *
 * 🔥 NOTE:
 * - traceId injected from CommandRouter
 * - fallback to session.traceId (temporary)
 */

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";
import { validateQuickAddContext } from "../../../rules/QuickAddGuards";
import { validateEntries } from "../../../validation/QuickAddValidator";

import { createLogger } from "../../../debug/DebugLogger";

const log = createLogger("CMD_FIX");

// =====================================
// 🚀 HANDLER
// =====================================

export async function handleFix(
  interaction: ChatInputCommandInteraction,
  traceId?: string // 🔥 NEW
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
    // 📥 LOAD BUFFER
    // =====================================
    const entries = QuickAddBuffer.getEntries(guildId);

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

    // =====================================
    // 🔥 REVALIDATION (CRITICAL)
    // =====================================
    const revalidated = await validateEntries(
      updatedRaw.map((e) => ({
        nickname: e.nickname,
        value: e.value,
      }))
    );

    // preserve IDs
    const merged = revalidated.map((v, i) => ({
      ...updatedRaw[i],
      status: v.status,
      confidence: v.confidence,
      suggestion: v.suggestion,
    }));

    // =====================================
    // 💾 SAVE BUFFER
    // =====================================
    QuickAddBuffer.setEntries(guildId, merged);

    log.trace("fix_applied", resolvedTraceId, {
      guildId,
      total: entries.length,
      fixed: applied,
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

    log.trace("fix_done", resolvedTraceId, {
      durationMs: Date.now() - startedAt,
    });

  } catch (err) {
    log.error("fix_failed", err, resolvedTraceId);

    await interaction.reply({
      content: "❌ Failed to apply fixes",
      ephemeral: true,
    });
  }
}