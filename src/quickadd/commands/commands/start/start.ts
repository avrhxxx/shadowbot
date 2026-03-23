// =====================================
// 📁 src/quickadd/commands/commands/start/start.ts
// =====================================

import { ChatInputCommandInteraction, TextChannel } from "discord.js";
import { QuickAddSession } from "../../../core/QuickAddSession";
import { createLogger } from "../../../debug/DebugLogger";

const log = createLogger("COMMAND");

export async function startCommand(
  interaction: ChatInputCommandInteraction
) {
  const guildId = interaction.guild!.id;

  log("start_attempt", {
    user: interaction.user.id,
    guildId,
  });

  const existing = QuickAddSession.get(guildId);

  if (existing) {
    log.warn("start_blocked_existing_session", {
      owner: existing.ownerId,
    });

    return interaction.editReply({
      content: `❌ Session already active by <@${existing.ownerId}>`,
    });
  }

  // =====================================
  // 🧵 VALIDATE CHANNEL
  // =====================================
  const channel = interaction.channel;

  if (!channel || !(channel instanceof TextChannel)) {
    log.warn("start_invalid_channel", {
      channelId: interaction.channelId,
    });

    return interaction.editReply({
      content: "❌ This command must be used in a server text channel",
    });
  }

  // =====================================
  // 🧵 CREATE THREAD
  // =====================================
  const thread = await channel.threads.create({
    name: `quickadd-${interaction.user.username}`,
    autoArchiveDuration: 60,
  });

  log("thread_created", {
    threadId: thread.id,
    parent: channel.id,
  });

  // =====================================
  // 🧠 START SESSION (threadId as channelId)
  // =====================================
  QuickAddSession.start(
    guildId,
    thread.id, // 🔥 thread is now the session context
    interaction.user.id
  );

  log("start_success", {
    user: interaction.user.id,
    threadId: thread.id,
  });

  // =====================================
  // 💬 RESPONSE
  // =====================================
  return interaction.editReply({
    content:
`✅ Session started

🧵 Thread: <#${thread.id}>

📸 Send screenshots inside this thread

Status:
📥 received
⏳ processing
✅ done
❌ error

📊 Preview is generated automatically after each image

You can also run manually:
→ /qa preview
→ /quickadd preview`,
  });
}