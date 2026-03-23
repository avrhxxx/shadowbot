// =====================================
// 📁 src/quickadd/commands/commands/start/start.ts
// =====================================

import { ChatInputCommandInteraction, TextChannel, ChannelType } from "discord.js";
import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddType } from "../../../core/QuickAddTypes";
import { createLogger } from "../../../debug/DebugLogger";

const log = createLogger("COMMAND");

export async function startCommand(
  interaction: ChatInputCommandInteraction
) {
  const guildId = interaction.guild!.id;

  const type = interaction.options.getString("type", true) as QuickAddType;

  log("start_attempt", {
    user: interaction.user.id,
    guildId,
    type,
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
  // 🧵 CREATE PRIVATE THREAD
  // =====================================
  const thread = await channel.threads.create({
    name: `qa-${type.toLowerCase()}-${interaction.user.username}`,
    autoArchiveDuration: 60,
    type: ChannelType.PrivateThread, // 🔒 PRIVATE
    invitable: false, // 🔒 nobody can invite others
  });

  // 🔥 ADD USER TO THREAD (required for private)
  await thread.members.add(interaction.user.id);

  log("thread_created", {
    threadId: thread.id,
    parent: channel.id,
  });

  // =====================================
  // 🧠 START SESSION
  // =====================================
  QuickAddSession.start(
    guildId,
    thread.id,
    interaction.user.id,
    type
  );

  log("start_success", {
    user: interaction.user.id,
    threadId: thread.id,
    type,
  });

  // =====================================
  // 💬 MESSAGE INSIDE THREAD (NEW UX)
  // =====================================
  await thread.send(
`🧠 **QuickAdd Session**

📂 Type: ${type}

📸 Send screenshots in this thread

Status:
📥 received
⏳ processing
✅ done
❌ error

📊 Preview updates automatically

Commands:
→ /q preview
→ /q adjust
→ /q end`
  );

  // =====================================
  // 💬 EPHEMERAL RESPONSE
  // =====================================
  return interaction.editReply({
    content:
`✅ Session started

🧵 Thread: <#${thread.id}>
📂 Type: ${type}

👉 Go to the thread and start sending screenshots`,
  });
}