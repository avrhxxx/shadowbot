// src/eventsPanel/eventsButtons/eventHelp.ts
import { ButtonInteraction, EmbedBuilder } from "discord.js";

export async function handleHelp(interaction: ButtonInteraction) {
  const embed = new EmbedBuilder()
    .setTitle("Event Panel Help")
    .setDescription(`
🟢 Create Event – creates a new event  
📄 List Events – shows the list of events  
🗑️ Cancel Event – cancels an event  
🔔 Manual Reminder – sends a manual reminder for participants  
⬇️ Download All Events – download participant lists for all events  
⚙️ Settings – configure the download channel and notification channel  
❓ Help – shows this description
  `);

  await interaction.reply({ embeds: [embed], ephemeral: true });
}