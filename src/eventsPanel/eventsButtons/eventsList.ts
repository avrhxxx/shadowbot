// src/eventsPanel/eventsButtons/eventsList.ts
import { ButtonInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import * as EventStorage from "../eventStorage";
import { EventObject } from "../eventService";

/**
 * Show ephemeral list of all events
 * Dynamic: Participants & Absent show counts only
 */
export async function handleList(interaction: ButtonInteraction) {
  const guildId = interaction.guildId!;
  const events: EventObject[] = await EventStorage.getEvents(guildId);

  if (!events || events.length === 0) {
    await interaction.reply({ content: "No events found.", ephemeral: true });
    return;
  }

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    const dateStr = `${pad(e.day)}/${pad(e.month)} ${pad(e.hour)}:${pad(e.minute)}`;

    const embed = new EmbedBuilder()
      .setTitle(e.name)
      .setDescription(
        `Status: ${e.status}\nDate: ${dateStr}\nParticipants: ${e.participants.length}` +
        (e.absent?.length ? `\nAbsent: ${e.absent.length}` : "")
      )
      .setColor(e.status === "ACTIVE" ? 0x00ff00 : e.status === "PAST" ? 0x808080 : 0xff0000);

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
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
        .setLabel("Add Absent")
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

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`event_compare_${e.id}`)
        .setLabel("Compare")
        .setStyle(ButtonStyle.Secondary)
    );

    const messagePayload = { embeds: [embed], components: [row1, row2], ephemeral: true };

    if (i === 0) {
      await interaction.reply(messagePayload);
    } else {
      await interaction.followUp(messagePayload);
    }
  }
}

/**
 * Handler Show List – wyświetla pełną listę uczestników i nieobecnych
 * Pokazuje raw nicki (dokładnie takie, jakie wpisano)
 */
export async function handleShowList(interaction: ButtonInteraction, eventId: string) {
  const guildId = interaction.guildId!;
  const events: EventObject[] = await EventStorage.getEvents(guildId);
  const event = events.find(e => e.id === eventId);

  if (!event) {
    await interaction.reply({ content: "Event not found.", ephemeral: true });
    return;
  }

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const dateStr = `${pad(event.day)}/${pad(event.month)} ${pad(event.hour)}:${pad(event.minute)}`;

  const participants = event.participants.length ? event.participants : ["None"];
  const absent = event.absent?.length ? event.absent : ["None"];

  // Literalne wyświetlanie nicków, brak pingów
  const participantsStr = participants.map(p => `\`${p}\``).join("\n");
  const absentStr = absent.map(a => `\`${a}\``).join("\n");

  const embed = new EmbedBuilder()
    .setTitle(`${event.name} – List`)
    .setDescription(
      `Status: ${event.status}\nDate: ${dateStr}\n\nParticipants (${participants.length}):\n${participantsStr}` +
      (absent.length && absent[0] !== "None" ? `\n\nAbsent (${absent.length}):\n${absentStr}` : "")
    )
    .setColor(event.status === "ACTIVE" ? 0x00ff00 : event.status === "PAST" ? 0x808080 : 0xff0000);

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

/**
 * Aktualizacja embedu głównej listy po dodaniu/usunięciu uczestnika
 */
export async function updateEventEmbed(message: any, eventId: string) {
  const guildId = message.guildId;
  if (!guildId) return;

  const events: EventObject[] = await EventStorage.getEvents(guildId);
  const e = events.find(ev => ev.id === eventId);
  if (!e) return;

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const dateStr = `${pad(e.day)}/${pad(e.month)} ${pad(e.hour)}:${pad(e.minute)}`;

  const embed = new EmbedBuilder()
    .setTitle(e.name)
    .setDescription(
      `Status: ${e.status}\nDate: ${dateStr}\nParticipants: ${e.participants.length}` +
      (e.absent?.length ? `\nAbsent: ${e.absent.length}` : "")
    )
    .setColor(e.status === "ACTIVE" ? 0x00ff00 : e.status === "PAST" ? 0x808080 : 0xff0000);

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
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
      .setLabel("Add Absent")
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

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`event_compare_${e.id}`)
      .setLabel("Compare")
      .setStyle(ButtonStyle.Secondary)
  );

  await message.edit({ embeds: [embed], components: [row1, row2] });
}