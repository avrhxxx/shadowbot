// =====================================
// 📁 src/quickadd/discord/actions/adjust/adjust.ts
// =====================================

/**
 * ✏️ ROLE:
 * Adjust entry + REVALIDATE buffer
 *
 * ❗ RULES:
 * - owner only
 * - revalidation required
 * - traceId MUST be injected (from router)
 * - NO traceId fallback (STRICT)
 * - sessionId included in logs
 *
 * ✅ FINAL:
 * - global logger (log.emit)
 * - no scoped logger
 * - full compliance with logging system
 */

import { ChatInputCommandInteraction } from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";
import { saveAdjusted } from "../../../storage/QuickAddRepository";

import {
  validateQuickAddContext,
  validateSessionOwner,
} from "../../../rules/QuickAddGuards";

import { validateEntries } from "../../../validation/QuickAddValidator";

import { log } from "../../../logger";

// =====================================
// 🚀 HANDLER
// =====================================

export async function handleAdjust(
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

  const contextError = validateQuickAddContext(
    interaction,
    session,
    traceId
  );

  const ownerError = validateSessionOwner(
    interaction,
    session,
    traceId
  );

  if (contextError || ownerError || !session) {
    await interaction.reply({
      content:
        contextError ??
        ownerError ??
        "❌ Session not found",
      ephemeral: true,
    });
    return;
  }

  const id = interaction.options.getInteger("id", true);
  const newNickname = interaction.options.getString("nickname");
  const newValue = interaction.options.getInteger("value");

  try {
    log.emit({
      event: "adjust_start",
      traceId,
      type: "user",
      data: {
        sessionId: session.sessionId,
        guildId,
        id,
        newNickname,
        newValue,
      },
    });

    const entries = QuickAddBuffer.getEntries(guildId, traceId);

    const index = entries.findIndex((e) => e.id === id);

    if (index === -1) {
      await interaction.reply({
        content: `❌ Entry with ID ${id} not found`,
        ephemeral: true,
      });
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
      traceId
    );

    const merged = revalidated.map((v, i) => ({
      ...newEntries[i],
      status: v.status,
      confidence: v.confidence,
      suggestion: v.suggestion,
    }));

    QuickAddBuffer.setEntries(guildId, merged, traceId);

    log.emit({
      event: "adjust_applied",
      traceId,
      type: "user",
      data: {
        sessionId: session.sessionId,
        id,
        before: target,
        after: updated,
      },
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
          traceId
        );

        log.emit({
          event: "learning_saved_adjust",
          traceId,
          type: "user",
          data: {
            sessionId: session.sessionId,
            from: target.nickname,
            to: newNickname,
          },
        });
      }
    } catch (err) {
      log.emit({
        event: "learning_failed_adjust",
        traceId,
        level: "warn",
        type: "user",
        data: {
          sessionId: session.sessionId,
          error: err,
        },
      });
    }

    await interaction.reply({
      content: `✅ Updated entry [${id}]`,
      ephemeral: true,
    });

    log.emit({
      event: "adjust_done",
      traceId,
      type: "user",
      data: {
        sessionId: session.sessionId,
        durationMs: Date.now() - startedAt,
      },
    });

  } catch (err) {
    log.emit({
      event: "adjust_failed",
      traceId,
      level: "error",
      type: "user",
      data: {
        error: err,
      },
    });

    await interaction.reply({
      content: "❌ Failed to adjust entry",
      ephemeral: true,
    });
  }
}