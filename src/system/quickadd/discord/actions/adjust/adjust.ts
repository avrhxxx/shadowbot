// =====================================
// 📁 src/system/quickadd/discord/actions/adjust/adjust.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";
import { saveAdjusted } from "../../../storage/QuickAddRepository";

import {
  validateQuickAddContext,
  validateSessionOwner,
} from "../../../rules/QuickAddGuards";

import { validateEntries } from "../../../validation/QuickAddValidator";

import { log } from "../../../../core/logger/log";
import { TraceContext } from "../../../../core/trace/TraceContext";

// =====================================
// 🔐 SAFE REPLY (EDIT ONLY)
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

export async function handleAdjust(
  interaction: ChatInputCommandInteraction,
  ctx: TraceContext
): Promise<void> {
  const startedAt = Date.now();
  const l = log.ctx(ctx);

  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ flags: 64 });
  }

  if (!guildId) {
    await safeReply(interaction, "❌ Guild only command");
    return;
  }

  const session = QuickAddSession.get(guildId, userId);

  const contextError = validateQuickAddContext(
    interaction,
    session,
    ctx.traceId
  );

  const ownerError = validateSessionOwner(
    interaction,
    session,
    ctx.traceId
  );

  if (contextError || ownerError || !session) {
    l.warn("adjust_blocked", {
      sessionId: session?.sessionId,
      guildId,
      userId,
      hasSession: !!session,
      reason: contextError ?? ownerError ?? "no_session",
    });

    await safeReply(
      interaction,
      contextError ?? ownerError ?? "❌ Session not found"
    );
    return;
  }

  const sessionId = session.sessionId;

  const id = interaction.options.getInteger("id", true);
  const newNickname = interaction.options.getString("nickname");
  const newValue = interaction.options.getInteger("value");

  if (id <= 0) {
    await safeReply(interaction, "❌ Invalid ID");
    return;
  }

  try {
    l.event("adjust_start", {
      sessionId,
      guildId,
      id,
      newNickname,
      newValue,
    });

    const entries = QuickAddBuffer.getEntries(sessionId, ctx.traceId);

    const index = entries.findIndex((e) => e.id === id);

    if (index === -1) {
      l.warn("entry_not_found", {
        sessionId,
        id,
      });

      await safeReply(
        interaction,
        `❌ Entry with ID ${id} not found`
      );
      return;
    }

    const target = entries[index];

    const updated = {
      ...target,
      nickname: newNickname ?? target.nickname,
      value: newValue ?? target.value,
    };

    const newEntries = [...entries];
    newEntries[index] = updated;

    const revalidated = await validateEntries(
      newEntries.map((e) => ({
        nickname: e.nickname,
        value: e.value,
      })),
      ctx.traceId
    );

    if (revalidated.length !== newEntries.length) {
      l.warn("revalidation_length_mismatch", {
        sessionId,
        before: newEntries.length,
        after: revalidated.length,
      });

      await safeReply(
        interaction,
        "❌ Internal error (revalidation mismatch)"
      );
      return;
    }

    const merged = revalidated.map((v, i) => ({
      ...newEntries[i],
      status: v.status,
      confidence: v.confidence,
      suggestion: v.suggestion,
    }));

    QuickAddBuffer.replaceEntries(sessionId, merged, ctx.traceId);

    l.event("adjust_applied", {
      sessionId,
      id,
      before: target,
      after: updated,
    });

    try {
      if (newNickname && newNickname !== target.nickname) {
        await saveAdjusted(
          [
            {
              ocr_raw: target.nickname,
              adjusted: newNickname,
            },
          ],
          ctx.traceId
        );

        l.event("learning_saved_adjust", {
          sessionId,
          from: target.nickname,
          to: newNickname,
        });
      }
    } catch (err) {
      l.warn("learning_failed_adjust", {
        sessionId,
        error: err,
      });
    }

    await safeReply(
      interaction,
      `✅ Updated entry [${id}]`
    );

    const duration = Date.now() - startedAt;

    l.event("adjust_done", {
      sessionId,
      durationMs: duration,
    });

  } catch (err) {
    const duration = Date.now() - startedAt;

    l.error("adjust_failed", {
      sessionId,
      durationMs: duration,
      error: err,
    });

    await safeReply(
      interaction,
      "❌ Failed to adjust entry"
    );
  }
}