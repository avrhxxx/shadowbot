// =====================================
// 📁 src/quickadd/discord/actions/fix/fix.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";
import { validateQuickAddContext } from "../../../rules/QuickAddGuards";
import { validateEntries } from "../../../validation/QuickAddValidator";

import { createScopedLogger } from "@/quickadd/debug/logger";

const log = createScopedLogger(import.meta.url);

export async function handleFix(
  interaction: ChatInputCommandInteraction,
  traceId: string
): Promise<void> {
  const startedAt = Date.now();

  const guildId = interaction.guildId;

  if (!guildId) {
    await interaction.reply({ content: "❌ Guild only command", ephemeral: true });
    return;
  }

  const session = QuickAddSession.get(guildId);
  const contextError = validateQuickAddContext(interaction, session);

  if (contextError || !session) {
    await interaction.reply({ content: contextError ?? "❌ Session not found", ephemeral: true });
    return;
  }

  try {
    log.trace("fix_start", traceId, { sessionId: session.sessionId });

    const entries = QuickAddBuffer.getEntries(guildId, traceId);

    let applied = 0;

    const updatedRaw = entries.map((entry) => {
      if (entry.suggestion && entry.suggestion !== entry.nickname) {
        applied++;
        return { ...entry, nickname: entry.suggestion };
      }
      return entry;
    });

    const revalidated = await validateEntries(
      updatedRaw.map((e) => ({ nickname: e.nickname, value: e.value })),
      traceId
    );

    if (revalidated.length !== updatedRaw.length) {
      log.warn("revalidation_length_mismatch", traceId, {
        sessionId: session.sessionId,
        before: updatedRaw.length,
        after: revalidated.length,
      });
    }

    const merged = revalidated.map((v, i) => ({
      ...updatedRaw[i],
      status: v.status,
      confidence: v.confidence,
      suggestion: v.suggestion,
    }));

    QuickAddBuffer.setEntries(guildId, merged, traceId);

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