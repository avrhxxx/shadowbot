// =====================================
// 📁 src/quickadd/commands/commands/adjust/adjust.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";

export async function adjustCommand(
  interaction: ChatInputCommandInteraction
) {
  const id = interaction.options.getInteger("id", true);
  const nickname = interaction.options.getString("nickname");
  const value = interaction.options.getInteger("value");

  const data = QuickAddBuffer.getEntries(interaction.guild!.id);

  if (!data[id - 1]) {
    return interaction.editReply({
      content: "❌ Invalid line ID",
    });
  }

  if (nickname) data[id - 1].nickname = nickname;
  if (value !== null) data[id - 1].value = value;

  return interaction.editReply({
    content: `✅ Updated entry [${id}]`,
  });
}