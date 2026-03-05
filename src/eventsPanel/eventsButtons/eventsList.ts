import { ButtonInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import * as EventStorage from "../eventStorage";
import { EventObject } from "../eventService";
import { formatUTCDate } from "../../utils/timeUtils";

/**
 * Funkcja do czyszczenia nicków – usuwa wszelkie pingowe ID i dziwne znaki
 */
function cleanNickname(nick: string) {
  return nick.replace(/<@!?[0-9]+>/g, "").trim();
}

/**
 * Aktualizuje statusy eventów ACTIVE -> PAST jeśli data minęła (UTC)
 */
async function updateEventStatuses(events: EventObject[], guildId: string) {
  const now = new Date();
  let updated = false;

  for (const e of events) {
    const eventDateUTC = new Date(Date.UTC(new Date().getUTCFullYear(), e.month - 1, e.day, e.hour, e.minute));
    if (e.status === "ACTIVE" && eventDateUTC.getTime() < now.getTime()) {
      e.status = "PAST";
      updated = true;
    }
  }

  if (updated) {
    await EventStorage.saveEvents(guildId, events);
    return await EventStorage.getEvents(guildId);
  }

  return events;
}

/**
 * Helper: formatuje EventObject na UTC string
 */
function formatEventUTCObj(e: EventObject) {
  const year = new Date().getUTCFullYear();
  return formatUTCDate(e.day, e.month, year, { hour: e.hour, minute: e.minute });
}

/**
 * Show ephemeral list of all events
 */
export async function handleList(interaction: ButtonInteraction) {
  const guildId = interaction.guildId!;
  let events: EventObject[] = await EventStorage.getEvents(guildId);

  if (!events || events.length === 0) {
    await interaction.reply({ content: "No events found.", ephemeral: true });
    return;
  }

  events = await updateEventStatuses(events, guildId);

  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    const eventDateUTCStr = formatEventUTCObj(e);

    const embed = new EmbedBuilder()
      .setTitle(e.name)
      .setDescription(
        `Status: ${e.status}\nUTC Date: ${eventDateUTCStr}\nParticipants: ${e.participants.length}` +
        (e.absent?.length ? `\nAbsent: ${e.absent.length}` : "")
      )
      .setColor(e.status === "ACTIVE" ? 0x00ff00 : e.status === "PAST" ? 0x808080 : 0xff0000);

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`event_add_${e.id}`).setLabel("Add Participant").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`event_remove_${e.id}`).setLabel("Remove Participant").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`event_absent_${e.id}`).setLabel("Add Absent").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`event_show_list_${e.id}`).setLabel("Show List").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`event_download_single_${e.id}`).setLabel("Download").setStyle(ButtonStyle.Primary)
    );

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`event_compare_${e.id}`).setLabel("Compare").setStyle(ButtonStyle.Secondary)
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
 */
export async function handleShowList(interaction: ButtonInteraction, eventId: string) {
  const guildId = interaction.guildId!;
  let events: EventObject[] = await EventStorage.getEvents(guildId);

  events = await updateEventStatuses(events, guildId);

  const event = events.find(e => e.id === eventId);
  if (!event) {
    await interaction.reply({ content: "Event not found.", ephemeral: true });
    return;
  }

  const participants = event.participants.length ? event.participants.map(cleanNickname) : [];
  const absent = event.absent?.length ? event.absent.map(cleanNickname) : [];
  const eventDateUTCStr = formatEventUTCObj(event);

  const embed = new EmbedBuilder()
    .setTitle(`List for ${event.name}`)
    .setDescription(
      `UTC Date: ${eventDateUTCStr}\nStatus: ${event.status}\n\nParticipants (${participants.length}):\n${participants.join("\n")}` +
      (absent.length ? `\n\nAbsent (${absent.length}):\n${absent.join("\n")}` : "")
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

  let events: EventObject[] = await EventStorage.getEvents(guildId);
  events = await updateEventStatuses(events, guildId);

  const e = events.find(ev => ev.id === eventId);
  if (!e) return;

  const eventDateUTCStr = formatEventUTCObj(e);

  const embed = new EmbedBuilder()
    .setTitle(e.name)
    .setDescription(
      `Status: ${e.status}\nUTC Date: ${eventDateUTCStr}\nParticipants: ${e.participants.length}` +
      (e.absent?.length ? `\nAbsent: ${e.absent.length}` : "")
    )
    .setColor(e.status === "ACTIVE" ? 0x00ff00 : e.status === "PAST" ? 0x808080 : 0xff0000);

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`event_add_${e.id}`).setLabel("Add Participant").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`event_remove_${e.id}`).setLabel("Remove Participant").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`event_absent_${e.id}`).setLabel("Add Absent").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`event_show_list_${e.id}`).setLabel("Show List").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`event_download_single_${e.id}`).setLabel("Download").setStyle(ButtonStyle.Primary)
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`event_compare_${e.id}`).setLabel("Compare").setStyle(ButtonStyle.Secondary)
  );

  await message.edit({ embeds: [embed], components: [row1, row2] });
}