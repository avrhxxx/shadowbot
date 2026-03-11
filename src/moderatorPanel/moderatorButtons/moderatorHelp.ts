// src/moderatorPanel/moderatorButtons/moderatorHelp.ts
import { Interaction, EmbedBuilder } from "discord.js";

export async function handleModeratorHelp(interaction: Interaction) {
  if (!interaction.isButton()) return;

  const embed = new EmbedBuilder()
    .setTitle("Moderator Panel Guide")
    .setDescription(`
🟢 **Event Menu** – opens the Event Panel where you can:
  • Create new events
  • View and manage participant lists
  • Cancel events or send manual reminders
  • Access all events at once and download/compare lists

⭐ **Points Menu** – not implemented yet

📝 **Translate Menu** – not implemented yet

🕒 **Absence Menu** – manage player absences:
  • Add or remove absences
  • See who is currently absent
  • Automatic notifications when absences start or end
  • Embed shows active absences and expected return dates

❓ **Help** – shows this description
`);

  await interaction.reply({ embeds: [embed], ephemeral: true });
}