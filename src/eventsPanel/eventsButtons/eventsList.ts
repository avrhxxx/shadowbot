// src/eventsPanel/eventsButtons/eventsList.ts
import { ButtonInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import * as EventStorage from "../eventStorage";
import { EventObject } from "../eventService";

/**
 * Show ephemeral list of all events
 * Each event → separate embed with buttons
 */
export async function handleList(interaction: ButtonInteraction) {
  const guildId = interaction.guildId!;
  const events: EventObject[] = await EventStorage.getEvents(guildId);

  if (!events || events.length === 0) {
    await interaction.reply({ content: "No events found.", ephemeral: true });
    return;
  }

  for (let i = 0; i < events.length; i++) {
    const e = events[i];

    const participantsList = e.participants.length
      ? e.participants.map(id => `<@${id}>`).join(", ")
      : "None";

    const absentList = e.absent && e.absent.length
      ? e.absent.map(id => `<@${id}>`).join(", ")
      : null;

    const embed = new EmbedBuilder()
      .setTitle(e.name)
      .setDescription(
        `Status: ${e.status}\nParticipants (${e.participants.length}): ${participantsList}` +
        (absentList ? `\nAbsent (${e.absent!.length}): ${absentList}` : "")
      )
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
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`event_show_list_${e.id}`)
        .setLabel("Show List")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`event_download_single_${e.id}`)
        .setLabel("Download")
        .setStyle(ButtonStyle.Primary)
    );

    // Pierwszy embed używa reply, reszta followUp
    if (i === 0) {
      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    } else {
      await interaction.followUp({ embeds: [embed], components: [row], ephemeral: true });
    }
  }
}