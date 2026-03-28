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

import { log, metrics, timing } from "../../../logger";

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
  traceId: string
): Promise<void> {
  const timerId = `adjust-${traceId}`;
  timing.start(timerId);

  const startedAt = Date.now();

  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  // 🔥 REQUIRED (lifecycle fix)
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
    traceId
  );

  const ownerError = validateSessionOwner(
    interaction,
    session,
    traceId
  );

  if (contextError || ownerError || !session) {
    metrics.increment("adjust_blocked");

    log.emit({
      event: "adjust_blocked",
      traceId,
      data: {
        guildId,
        userId,
        reason: contextError ?? ownerError ?? "no_session",
      },
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

  try {
    metrics.increment("adjust_started");

    log.emit({
      event: "adjust_start",
      traceId,
      data: {
        sessionId,
        guildId,
        id,
        newNickname,
        newValue,
      },
    });

    // =====================================
    // 📥 LOAD BUFFER
    // =====================================
    const entries = QuickAddBuffer.getEntries(sessionId, traceId);

    const index = entries.findIndex((e) => e.id === id);

    if (index === -1) {
      await safeReply(
        interaction,
        `❌ Entry with ID ${id} not found`
      );
      return;
    }

    const target = entries[index];

    // =====================================
    // 🔧 APPLY CHANGE
    // =====================================
    const updated = {
      ...target,
      nickname: newNickname ?? target.nickname,
      value: newValue ?? target.value,
    };

    const newEntries = [...entries];
    newEntries[index] = updated;

    // =====================================
    // 🔁 REVALIDATION
    // =====================================
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

    // =====================================
    // 💾 SAVE BUFFER
    // =====================================
    QuickAddBuffer.replaceEntries(sessionId, merged, traceId);

    log.emit({
      event: "adjust_applied",
      traceId,
      data: {
        sessionId,
        id,
        before: target,
        after: updated,
      },
    });

    // =====================================
    // 🧠 LEARNING SAVE
    // =====================================
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
        data: {
          sessionId,
          error: err,
        },
      });
    }

    await safeReply(
      interaction,
      `✅ Updated entry [${id}]`
    );

    const duration = timing.end(timerId);

    metrics.increment("adjust_success");

    log.emit({
      event: "adjust_done",
      traceId,
      data: {
        sessionId,
        durationMs: duration,
      },
    });

  } catch (err) {
    const duration = timing.end(timerId);

    metrics.increment("adjust_error");

    log.emit({
      event: "adjust_failed",
      traceId,
      level: "error",
      data: {
        error: err,
        durationMs: duration,
      },
    });

    await safeReply(
      interaction,
      "❌ Failed to adjust entry"
    );
  }
}