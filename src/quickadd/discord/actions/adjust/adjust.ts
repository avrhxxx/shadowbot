// =====================================
// 📁 src/quickadd/discord/actions/adjust/adjust.ts
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
  const userId = interaction.user.id;

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

  const ownerError = validateSessionOwner(
    interaction,
    session,
    traceId
  );

  if (contextError || ownerError || !session) {
    await interaction.editReply(
      contextError ?? ownerError ?? "❌ Session not found"
    );
    return;
  }

  const sessionId = session.sessionId;

  const id = interaction.options.getInteger("id", true);
  const newNickname = interaction.options.getString("nickname");
  const newValue = interaction.options.getInteger("value");

  try {
    log.emit({
      event: "adjust_start",
      traceId,
      type: "user",
      data: {
        sessionId,
        guildId,
        id,
        newNickname,
        newValue,
      },
    });

    // 🔥 SESSION-BASED BUFFER
    const entries = QuickAddBuffer.getEntries(sessionId, traceId);

    const index = entries.findIndex((e) => e.id === id);

    if (index === -1) {
      await interaction.editReply(
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
      traceId
    );

    const merged = revalidated.map((v, i) => ({
      ...newEntries[i],
      status: v.status,
      confidence: v.confidence,
      suggestion: v.suggestion,
    }));

    // 🔥 SESSION-BASED WRITE
    QuickAddBuffer.replaceEntries(sessionId, merged, traceId);

    log.emit({
      event: "adjust_applied",
      traceId,
      type: "user",
      data: {
        sessionId,
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
            sessionId,
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
          sessionId,
          error: err,
        },
      });
    }

    await interaction.editReply(
      `✅ Updated entry [${id}]`
    );

    log.emit({
      event: "adjust_done",
      traceId,
      type: "user",
      data: {
        sessionId,
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

    await interaction.editReply(
      "❌ Failed to adjust entry"
    );
  }
}