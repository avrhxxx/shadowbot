import { ButtonInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import * as EventStorage from "../eventStorage";

export async function handleList(interaction: ButtonInteraction) {
  const guildId = interaction.guildId!;
  const events = await EventStorage.getEvents(guildId);

  if (events.length === 0) {
    await interaction.reply({ content: "No events found.", ephemeral: true });
    return;
  }

  for (const e of events) {
    const embed = new EmbedBuilder()
      .setTitle(e.name)
      .setDescription(`Status: ${e.status}\nParticipants: ${e.participants.length}`)
      .setColor(e.status === "ACTIVE" ? "Green" : e.status === "PAST" ? "Grey" : "Red");

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`event_add_${e.id}`)
        .setLabel("Add Participant")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`event_remove_${e.id}`)
        .setLabel("Remove Participant")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`event_absent_${e.id}`)
        .setLabel("Absent")
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
}