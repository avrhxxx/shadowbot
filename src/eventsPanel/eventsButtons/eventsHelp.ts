
import { Interaction, EmbedBuilder } from "discord.js";

export async function handleHelp(interaction: Interaction) {
  if (!interaction.isButton()) return;

  const embed = new EmbedBuilder()
    .setTitle("Event Help")
    .setDescription(`
🟢 Create – tworzy event  
📄 List – lista eventów  
🗑️ Cancel – anulowanie  
🔔 Reminder – przypomnienie  
⬇️ Download – uczestnicy  
⚙️ Settings – kanał globalny
`);

  await interaction.reply({ embeds: [embed], ephemeral: true });
}