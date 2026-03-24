// =====================================
// 📁 src/quickadd/commands/commands/start/start.ts
// =====================================

import { ChatInputCommandInteraction, TextChannel, ChannelType } from "discord.js";
import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddType } from "../../../core/QuickAddTypes";
import { createLogger } from "../../../debug/DebugLogger";

// 🔥 NEW
import { formatType } from "../../../utils/formatType";

const log = createLogger("COMMAND");

export async function startCommand(
  interaction: ChatInputCommandInteraction
) {
  const guildId = interaction.guild!.id;

  const type = interaction.options.getString("type", true) as QuickAddType;

  const readableType = formatType(type);

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
  // 🧵 CREATE PRIVATE THREAD (IMPROVED NAME)
  // =====================================
  const shortId = Math.random().toString(36).slice(2, 7).toUpperCase();

  const thread = await channel.threads.create({
    name: `📊 ${readableType} • ${shortId}`,
    autoArchiveDuration: 60,
    type: ChannelType.PrivateThread,
    invitable: false,
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
  // 💬 MESSAGE INSIDE THREAD (UX IMPROVED)
  // =====================================
  await thread.send(
`🧠 **QuickAdd Session**

📂 Type: ${readableType}

📸 Send screenshots in this thread

━━━━━━━━━━━━━━━━━━

📊 **Live status**
📥 received  
⏳ processing  
✅ done  
❌ error  

━━━━━━━━━━━━━━━━━━

⚙️ **Commands**
→ /q preview  
→ /q adjust  
→ /q confirm  
→ /q end`
  );

  // =====================================
  // 💬 EPHEMERAL RESPONSE (UX IMPROVED)
  // =====================================
  return interaction.editReply({
    content:
`✅ Session started

🧵 Thread: <#${thread.id}>
📂 Type: ${readableType}

👉 Go to the thread and start sending screenshots`,
  });
}