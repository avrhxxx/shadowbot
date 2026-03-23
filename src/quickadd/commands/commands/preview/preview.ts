// =====================================
// 📁 src/quickadd/commands/commands/preview/preview.ts
// =====================================

import { ChatInputCommandInteraction } from "discord.js";
import { QuickAddBuffer } from "../../../storage/QuickAddBuffer";

export async function previewCommand(
  interaction: ChatInputCommandInteraction
) {
  const data = QuickAddBuffer.getEntries(interaction.guild!.id);

  if (!data.length) {
    return interaction.editReply({
      content: "⚠️ No parsed data yet",
    });
  }

  const formatted = data
    .map((entry, index) => {
      return `[${index + 1}] ${entry.nickname} → ${entry.value}`;
    })
    .join("\n");

  return interaction.editReply({
    content: `📊 Preview:\n\n\`\`\`\n${formatted}\n\`\`\``,
  });
}