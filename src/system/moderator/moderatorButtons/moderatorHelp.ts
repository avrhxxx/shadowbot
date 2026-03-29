// src/system/moderator/moderatorButtons/moderatorHelp.ts

import { Interaction, EmbedBuilder } from "discord.js";
import { log } from "../../../core/logger/log";
import { TraceContext } from "../../../core/trace/TraceContext";

export async function handleModeratorHelp(
  interaction: Interaction,
  ctx: TraceContext
) {
  if (!interaction.isButton()) return;

  const l = log.ctx(ctx);

  l.event("moderator_help_open", {
    guildId: interaction.guildId,
    id: interaction.customId,
  });

  const embed = new EmbedBuilder()
    .setTitle("Moderator Panel Guide")
    .setColor(0x1E90FF)
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