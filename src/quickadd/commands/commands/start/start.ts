// =====================================
// 📁 src/quickadd/commands/commands/start/start.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";
import { QuickAddSession } from "../../../core/QuickAddSession";

export async function startCommand(
  interaction: ChatInputCommandInteraction
) {
  const session = QuickAddSession.get(interaction.guild!.id);

  if (session) {
    return interaction.editReply({
      content: `❌ Session already active by <@${session.ownerId}>`,
    });
  }

  QuickAddSession.start(
    interaction.guild!.id,
    interaction.channelId,
    interaction.user.id
  );

  return interaction.editReply({
    content: "✅ Session started\n\n📸 Send screenshots now.",
  });
}