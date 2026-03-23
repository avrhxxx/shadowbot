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

  const session = QuickAddSession.get(guildId);

  if (session) {
    log.warn("start_blocked_existing_session", {
      owner: session.ownerId,
    });

    return interaction.editReply({
      content: `❌ Session already active by <@${session.ownerId}>`,
    });
  }

  // =====================================
  // 🧵 CREATE THREAD (SAFE TYPE)
  // =====================================
  const channel = interaction.channel;

  if (!channel || !(channel instanceof TextChannel)) {
    log.warn("start_invalid_channel");

    return interaction.editReply({
      content: "❌ This command must be used in a server text channel",
    });
  }

  const thread = await channel.threads.create({
    name: `quickadd-${interaction.user.username}`,
    autoArchiveDuration: 60,
  });

  // =====================================
  // 🧠 START SESSION
  // =====================================
  QuickAddSession.start(
    guildId,
    thread.id,
    interaction.user.id
  );

  log("start_success", {
    user: interaction.user.id,
    threadId: thread.id,
  });

  return interaction.editReply({
    content:
`✅ Session started

🧵 Thread: <#${thread.id}>

📸 Send screenshots inside the thread

Status:
📥 received
⏳ processing
✅ done
❌ error

📊 Preview will be generated automatically

You can also run:
→ /qa preview
→ /quickadd preview`,
  });
}