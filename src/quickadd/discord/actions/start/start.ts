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
    await interaction.reply({
      content: "❌ Guild only command",
      ephemeral: true,
    });
    return;
  }

  const rawType = interaction.options.getString("type", true);

  if (!isQuickAddType(rawType)) {
    await interaction.reply({
      content: "❌ Invalid QuickAdd type",
      ephemeral: true,
    });
    return;
  }

  const type: QuickAddType = rawType;

  let threadId: string | null = null;

  try {
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
      await interaction.reply({
        content: "⚠️ A session is already active",
        ephemeral: true,
      });
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

    const channel = interaction.channel as TextChannel;

    // =====================================
    // 🔒 CREATE PRIVATE THREAD (JAK WCZEŚNIEJ)
    // =====================================
    const thread = await channel.threads.create({
      name: `quickadd-${type.toLowerCase()}`,
      autoArchiveDuration: 60,
      type: 12, // 🔥 PRIVATE THREAD (ChannelType.PrivateThread)
    });

    threadId = thread.id;

    // tylko owner → prywatność dla userów
    await thread.members.add(userId);

    // =====================================
    // 🔗 ATTACH THREAD TO SESSION
    // =====================================
    QuickAddSession.setThreadId(guildId, thread.id, traceId);

    // =====================================
    // 📤 THREAD MESSAGE
    // =====================================
    await thread.send({
      content: "🚀 QuickAdd session started\n\nSend screenshots here.",
    });

    // =====================================
    // 📤 RESPONSE
    // =====================================
    await interaction.reply({
      content: `✅ QuickAdd started\n🔒 Private thread: <#${thread.id}>`,
      ephemeral: true,
    });

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
    QuickAddSession.end(guildId, traceId);

    // ❗ CLEANUP THREAD
    if (
      threadId &&
      interaction.channel &&
      (interaction.channel instanceof TextChannel ||
        interaction.channel instanceof NewsChannel)
    ) {
      try {
        const thread = await interaction.channel.threads.fetch(threadId);
        await thread?.delete();
      } catch {}
    }

    // ❗ SAFE REPLY
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ Failed to start session",
        ephemeral: true,
      });
    }
  }
}