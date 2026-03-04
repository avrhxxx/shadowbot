// src/moderatorPanel/moderatorButtons/moderatorHelp.ts
import { Interaction, EmbedBuilder } from "discord.js";

export async function handleModeratorHelp(interaction: Interaction) {
  if (!interaction.isButton()) return;

  const embed = new EmbedBuilder()
    .setTitle("Moderator Panel Help")
    .setDescription(`
🟢 Event Menu – go to Event Panel  
⭐ Points Menu – not implemented yet  
📝 Translate Menu – not implemented yet  
❓ Help – shows this description
  `);

  await interaction.reply({ embeds: [embed], ephemeral: true });
}