// =====================================
// 📁 src/quickadd/discord/actions/start/start.ts
// =====================================

import {
  ChatInputCommandInteraction,
  TextChannel,
  NewsChannel,
} from "discord.js";

import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddType } from "../../../core/QuickAddTypes";
import { logger } from "../../../core/logger/log";

// =====================================
// 🔐 SAFE REPLY
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
// 🔹 TYPE GUARD
// =====================================

function isQuickAddType(value: string): value is QuickAddType {
  return [
    "DONATIONS_POINTS",
    "DUEL_POINTS",
    "RR_SIGNUPS",
    "RR_RESULTS",
  ].includes(value);
}

// =====================================
// 🚀 HANDLER
// =====================================

export async function handleStart(
  interaction: ChatInputCommandInteraction,
  traceId: string
): Promise<void> {
  const startTime = Date.now();

  // 🔥 lifecycle safety
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ flags: 64 });
  }

  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  // =====================================
  // 📥 ENTRY LOG
  // =====================================

  logger.emit({
    event: "start_requested",
    traceId,
    context: {
      guildId,
      userId,
    },
  });

  if (!guildId) {
    await safeReply(interaction, "❌ Guild only command");
    return;
  }

  const rawType = interaction.options.getString("type", true);

  if (!isQuickAddType(rawType)) {
    logger.emit({
      event: "start_invalid_type",
      traceId,
      level: "warn",
      context: {
        guildId,
        userId,
        rawType,
      },
    });

    await safeReply(interaction, "❌ Invalid QuickAdd type");
    return;
  }

  const type: QuickAddType = rawType;

  let threadId: string | null = null;

  try {
    logger.emit({
      event: "start_start",
      traceId,
      context: {
        guildId,
        userId,
        type,
      },
      stats: {
        start_started: 1,
      },
    });

    // =====================================
    // 🧠 START SESSION
    // =====================================
    const session = QuickAddSession.start(
      {
        guildId,
        userId,
        ownerId: userId,
        threadId: null,
        type,
      },
      traceId
    );

    if (!session) {
      logger.emit({
        event: "start_blocked_existing_session",
        traceId,
        level: "warn",
        context: {
          guildId,
          userId,
        },
      });

      await safeReply(
        interaction,
        "⚠️ You already have an active session"
      );
      return;
    }

    // =====================================
    // 📢 CHANNEL GUARD
    // =====================================
    if (
      !interaction.channel ||
      !(interaction.channel instanceof TextChannel ||
        interaction.channel instanceof NewsChannel)
    ) {
      throw new Error("Invalid channel type");
    }

    // =====================================
    // 🧵 THREAD
    // =====================================
    const thread = await interaction.channel.threads.create({
      name: `quickadd-${type.toLowerCase()}`,
      autoArchiveDuration: 60,
      reason: "QuickAdd session",
    });

    threadId = thread.id;

    await thread.members.add(userId);

    // =====================================
    // 🔗 ATTACH THREAD
    // =====================================
    QuickAddSession.setThreadId(
      guildId,
      userId,
      thread.id,
      traceId
    );

    // =====================================
    // 📤 THREAD MESSAGE
    // =====================================
    await thread.send({
      content: "🚀 QuickAdd session started\n\nSend screenshots here.",
    });

    // =====================================
    // 📤 RESPONSE
    // =====================================
    await safeReply(
      interaction,
      `✅ QuickAdd started\n📍 Thread: <#${thread.id}>`
    );

    const duration = Date.now() - startTime;

    logger.emit({
      event: "start_done",
      traceId,
      context: {
        sessionId: session.sessionId,
        threadId,
      },
      stats: {
        durationMs: duration,
        start_success: 1,
      },
    });

  } catch (err) {
    const duration = Date.now() - startTime;

    logger.emit({
      event: "start_failed",
      traceId,
      level: "error",
      error: err,
      context: {
        guildId,
      },
      stats: {
        durationMs: duration,
        start_error: 1,
      },
    });

    // ❗ CLEANUP SESSION
    QuickAddSession.end(guildId, userId, traceId);

    // ❗ CLEANUP THREAD
    if (threadId) {
      try {
        const thread = await interaction.client.channels.fetch(
          threadId
        );

        if (thread && "delete" in thread) {
          await thread.delete();
        }
      } catch {}
    }

    await safeReply(
      interaction,
      "❌ Failed to start session"
    );
  }
}