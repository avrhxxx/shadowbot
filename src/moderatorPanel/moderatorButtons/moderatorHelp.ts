// src/moderatorPanel/moderatorButtons/moderatorHelp.ts
import { Interaction, EmbedBuilder } from "discord.js";

export async function handleModeratorHelp(interaction: Interaction) {
  if (!interaction.isButton()) return;

  const embed = new EmbedBuilder()
    .setTitle("Moderator Panel Guide")
    .setColor(0x1E90FF) // niebieski, pasujący do panelu
    .addFields(
      {
        name: "🟢 Event Menu",
        value: `
Opens the Event Panel where you can:
• Create new events  
• View and manage participant lists  
• Cancel events or send manual reminders  
• Access all events at once and download/compare lists
        `
      },
      {
        name: "⭐ Points Menu",
        value: "Not implemented yet."
      },
      {
        name: "🕒 Absence Menu",
        value: `
Manage player absences:
• Add or remove absences  
• See who is currently absent  
• Automatic notifications when absences start or end  
• Embed shows active absences and expected return dates
        `
      },
      {
        name: "📝 Translate Menu",
        value: "Not implemented yet."
      },
      {
        name: "❓ Help",
        value: "Shows this description."
      }
    );

  await interaction.reply({ embeds: [embed], ephemeral: true });
}