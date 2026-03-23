// =====================================
// 📁 src/quickadd/commands/commands/end/end.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";
import { QuickAddSession } from "../../../core/QuickAddSession";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";

export async function endCommand(
  interaction: ChatInputCommandInteraction
) {
  const session = QuickAddSession.get(interaction.guild!.id);

  if (!session) {
    return interaction.editReply({
      content: "❌ No active session",
    });
  }

  if (session.ownerId !== interaction.user.id) {
    return interaction.editReply({
      content: "❌ Only session owner can end it",
    });
  }

  QuickAddSession.end(interaction.guild!.id);
  QuickAddBuffer.clear(interaction.guild!.id);

  return interaction.editReply({
    content: "🛑 Session ended",
  });
}