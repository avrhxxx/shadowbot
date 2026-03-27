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
import { log } from "../../../logger";

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
// 🔐 SAFE REPLY (FIX: defer support)
// =====================================

async function safeReply(
  interaction: ChatInputCommandInteraction,
  content: string
) {
  if (interaction.deferred && !interaction.replied) {
    await interaction.editReply({ content });
    return;
  }

  if (!interaction.replied && !interaction.deferred) {
    await interaction.reply({ content, ephemeral: true });
  }
}

// =====================================
// 🚀 HANDLER
// =====================================

export async function handleStart(
  interaction: ChatInputCommandInteraction,
  traceId: string
): Promise<void> {
  const startedAt = Date.now();

  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  if (!guildId) {
    await safeReply(interaction, "❌ Guild only command");
    return;
  }

  const rawType = interaction.options.getString("type", true);

  if (!isQuickAddType(rawType)) {
    await safeReply(interaction, "❌ Invalid QuickAdd type");
    return;
  }

  const type: QuickAddType = rawType;

  let threadId: string | null = null;

  try {
    // =====================================
    // ⚡ FIX: ACK INTERACTION ASAP
    // =====================================
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferReply({ ephemeral: true });
    }

    // =====================================
    // 🧠 START SESSION FIRST
    // =====================================
    const session = QuickAddSession.start(
      {
        guildId,
        ownerId: userId,
        threadId: null,
        type,
      },
      traceId
    );

    if (!session) {
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
    // 📩 CREATE STARTER MESSAGE
    // =====================================
    const starterMessage = await interaction.channel.send({
      content: `🚀 QuickAdd session: ${type}`,
    });

    // =====================================
    // 🧵 THREAD
    // =====================================
    const thread = await starterMessage.startThread({
      name: `quickadd-${type.toLowerCase()}`,
      autoArchiveDuration: 60,
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

    log.emit({
      event: "start_done",
      traceId,
      data: {
        sessionId: session.sessionId,
        threadId,
        durationMs: Date.now() - startedAt,
      },
    });

  } catch (err) {
    log.emit({
      event: "start_failed",
      traceId,
      level: "error",
      data: {
        error: err,
        guildId,
      },
    });

    // ❗ CLEANUP SESSION
    QuickAddSession.end(guildId, userId, traceId);

    // ❗ CLEANUP THREAD (SAFE)
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