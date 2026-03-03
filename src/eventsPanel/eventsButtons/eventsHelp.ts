import { ButtonInteraction, EmbedBuilder } from "discord.js";

export async function handleHelp(interaction: ButtonInteraction) {
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