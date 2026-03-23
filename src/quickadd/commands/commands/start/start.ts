// =====================================
// 📁 src/quickadd/commands/commands/start/start.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";
import { QuickAddSession } from "../../../core/QuickAddSession";
import { createLogger } from "../../../debug/DebugLogger"; // 🔥 NEW

const log = createLogger("COMMAND"); // 🔥 NEW

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

  QuickAddSession.start(
    guildId,
    interaction.channelId,
    interaction.user.id
  );

  log("start_success", {
    user: interaction.user.id,
    channel: interaction.channelId,
  });

  return interaction.editReply({
    content: 
`✅ Session started

📸 Send screenshots now

Status:
📥 received
⏳ processing
✅ done
❌ error

📊 A preview will be generated automatically after processing.

You can also run it manually anytime:
→ /qa preview
→ /quickadd preview`
  });
}