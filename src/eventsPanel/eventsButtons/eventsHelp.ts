// src/eventsPanel/eventsButtons/eventHelp.ts
import { ButtonInteraction, EmbedBuilder } from "discord.js";

export async function handleHelp(interaction: ButtonInteraction) {
  const embed = new EmbedBuilder()
    .setTitle("Event Panel Help")
    .setDescription(`
Create Event – creates a new event  
Events List – displays events grouped by category; shows detailed participant information for each event individually  
Cancel Event – cancels an event  
Manual Reminder – sends a manual reminder for participants  
Show All – displays all events together in a single view; allows downloading all participant lists at once and comparing events  
Settings – configure the download channel and notification channel  
Help – shows this description
  `);

  await interaction.reply({ embeds: [embed], ephemeral: true });
}