// src/moderatorPanel/moderatorButtons/absenceHelp.ts
import { ButtonInteraction, EmbedBuilder } from "discord.js";

export async function handleAbsenceHelp(interaction: ButtonInteraction) {
  if (!interaction.isButton()) return;

  const embed = new EmbedBuilder()
    .setTitle("Absence Panel Guide")
    .setColor(0x1E90FF) // niebieski, pasujący do panelu
    .addFields(
      { 
        name: "👋 Welcome", 
        value: "Manage and track player absences efficiently." 
      },
      { 
        name: "🟢 Absences List", 
        value: `
• **Add Absence** – manually add a new player absence  
• **Remove Absence** – remove a player who returned (shown only if there are active absences)  
• See player names, absence periods, and back dates  
• Embed updates automatically every minute
        `
      },
      { 
        name: "⚙️ Settings", 
        value: "Configure the notification channel and absence embed." 
      },
      { 
        name: "❓ Guide", 
        value: "Opens this guide." 
      },
      { 
        name: "💡 Tips", 
        value: `
• Players are automatically removed after their absence period ends  
• Embed updates live based on the database  
• Useful for moderators to quickly track who’s absent and when they return
        `
      }
    );

  await interaction.reply({ embeds: [embed], ephemeral: true });
}