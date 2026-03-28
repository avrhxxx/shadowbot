// =====================================
// 📁 src/system/quickadd/discord/actions/adjust/adjust.ts
// =====================================

/**
 * 🧠 ROLE:
 * Adjusts a single entry in buffer by ID.
 *
 * Responsible for:
 * - updating nickname/value
 * - revalidating ALL entries
 * - saving learning (adjusted nicknames)
 *
 * ❗ RULES:
 * - id-based modification ONLY
 * - revalidation REQUIRED
 * - owner-only
 * - logger.emit ONLY
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

import { logger } from "../../../../core/logger/log";

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
  const startedAt = Date.now();

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
    traceId
  );

  const ownerError = validateSessionOwner(
    interaction,
    session,
    traceId
  );

  if (contextError || ownerError || !session) {
    logger.emit({
      scope: "quickadd.adjust",
      event: "adjust_blocked",
      traceId,
      level: "warn",
      context: {
        sessionId: session?.sessionId,
        guildId,
        userId,
        hasSession: !!session,
        reason: contextError ?? ownerError ?? "no_session",
      },
      stats: {
        adjust_blocked: 1,
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

  if (id <= 0) {
    await safeReply(interaction, "❌ Invalid ID");
    return;
  }

  try {
    logger.emit({
      scope: "quickadd.adjust",
      event: "adjust_start",
      traceId,
      context: {
        sessionId,
        guildId,
        id,
        newNickname,
        newValue,
      },
      stats: {
        adjust_started: 1,
      },
    });

    const entries = QuickAddBuffer.getEntries(sessionId, traceId);

    const index = entries.findIndex((e) => e.id === id);

    if (index === -1) {
      logger.emit({
        scope: "quickadd.adjust",
        event: "entry_not_found",
        traceId,
        level: "warn",
        context: {
          sessionId,
          id,
        },
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
      traceId
    );

    if (revalidated.length !== newEntries.length) {
      logger.emit({
        scope: "quickadd.adjust",
        event: "revalidation_length_mismatch",
        traceId,
        level: "warn",
        context: {
          sessionId,
          before: newEntries.length,
          after: revalidated.length,
        },
        stats: {
          adjust_revalidation_mismatch: 1,
        },
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

    QuickAddBuffer.replaceEntries(sessionId, merged, traceId);

    logger.emit({
      scope: "quickadd.adjust",
      event: "adjust_applied",
      traceId,
      context: {
        sessionId,
        id,
      },
      meta: {
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

        logger.emit({
          scope: "quickadd.adjust",
          event: "learning_saved_adjust",
          traceId,
          context: {
            sessionId,
            from: target.nickname,
            to: newNickname,
          },
        });
      }
    } catch (err) {
      logger.emit({
        scope: "quickadd.adjust",
        event: "learning_failed_adjust",
        traceId,
        level: "warn",
        context: {
          sessionId,
        },
        error: err,
      });
    }

    await safeReply(
      interaction,
      `✅ Updated entry [${id}]`
    );

    const duration = Date.now() - startedAt;

    logger.emit({
      scope: "quickadd.adjust",
      event: "adjust_done",
      traceId,
      context: {
        sessionId,
      },
      meta: {
        durationMs: duration,
      },
      stats: {
        adjust_success: 1,
      },
    });

  } catch (err) {
    const duration = Date.now() - startedAt;

    logger.emit({
      scope: "quickadd.adjust",
      event: "adjust_failed",
      traceId,
      level: "error",
      meta: {
        durationMs: duration,
      },
      stats: {
        adjust_error: 1,
      },
      error: err,
    });

    await safeReply(
      interaction,
      "❌ Failed to adjust entry"
    );
  }
}