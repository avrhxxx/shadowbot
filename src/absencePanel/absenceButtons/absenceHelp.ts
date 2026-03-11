// src/moderatorPanel/moderatorButtons/absenceHelp.ts
import { ButtonInteraction, EmbedBuilder } from "discord.js";

export async function handleAbsenceHelp(interaction: ButtonInteraction) {
  if (!interaction.isButton()) return;

  const embed = new EmbedBuilder()
    .setTitle("Absence Panel Guide")
    .setDescription(`
👋 Welcome to the Absence Panel! Manage and track player absences efficiently.

**🟢 Absences List** – view all current absences:
• **Add Absence** – manually add a new player absence  
• **Remove Absence** – remove a player who returned (only shown if there are active absences)  
• See player names, absence periods, and back dates  
• Updated automatically every minute

**⚙️ Settings** – configure the notification channel and absence embed

**❓ Guide** – opens this guide

💡 Tips:
• Players are automatically removed after their absence period ends  
• Embed updates live based on the database
• Useful for moderators to quickly track who’s absent and when they return
`);

  await interaction.reply({ embeds: [embed], ephemeral: true });
}