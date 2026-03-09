// src/eventsPanel/eventsButtons/eventsList.ts
import { 
  ButtonInteraction, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  Message 
} from "discord.js";
import { getEvents, EventObject } from "../eventService";
import { formatEventUTC } from "../../utils/timeUtils";

// -----------------------------
// STATUS COLORS
// -----------------------------
const STATUS_COLORS: Record<string, number> = {
  ACTIVE: 0x00ff00,
  PAST: 0x808080,
  CANCELED: 0xff0000
};

// -----------------------------
// HELPERS
// -----------------------------
function cleanNickname(nick: string) {
  return nick.replace(/<@!?[0-9]+>/g, "").trim();
}

function formatEventUTCObj(e: EventObject) {
  return formatEventUTC(e.day, e.month, e.hour, e.minute, e.year ?? new Date().getUTCFullYear());
}

function createEventEmbedAndRows(e: EventObject) {
  const embed = new EmbedBuilder()
    .setTitle(e.name)
    .setDescription(
      `Status: ${e.status}\nUTC Date: ${formatEventUTCObj(e)}\nParticipants: ${e.participants.length}` +
      (e.absent?.length ? `\nAbsent: ${e.absent.length}` : "")
    )
    .setColor(STATUS_COLORS[e.status] ?? 0xffffff);

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`event_add_${e.id}`).setLabel("Add Participant").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`event_remove_${e.id}`).setLabel("Remove Participant").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`event_absent_${e.id}`).setLabel("Add Absent").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`event_show_list_${e.id}`).setLabel("Show List").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`event_download_single_${e.id}`).setLabel("Download").setStyle(ButtonStyle.Primary)
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(`event_compare_${e.id}`).setLabel("Compare").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`event_clear_${e.id}`).setLabel("Clear Event Data").setStyle(ButtonStyle.Danger)
  );

  return { embed, rows: [row1, row2] };
}

// -----------------------------
// LIST HANDLER
// -----------------------------
export async function handleList(interaction: ButtonInteraction) {
  const guildId = interaction.guildId!;
  const events = await getEvents(guildId);

  if (!events?.length) {
    await interaction.reply({ content: "No events found.", ephemeral: true });
    return;
  }

  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    const { embed, rows } = createEventEmbedAndRows(e);
    const payload = { embeds: [embed], components: rows, ephemeral: true };

    if (i === 0) await interaction.reply(payload);
    else await interaction.followUp(payload);
  }
}

// -----------------------------
// SHOW LIST HANDLER
// -----------------------------
export async function handleShowList(interaction: ButtonInteraction, eventId: string) {
  const guildId = interaction.guildId!;
  const events = await getEvents(guildId);
  const event = events.find(e => e.id.toString() === eventId.toString());

  if (!event) {
    await interaction.reply({ content: "Event not found.", ephemeral: true });
    return;
  }

  const participants = event.participants.map(cleanNickname);
  const absent = event.absent?.map(cleanNickname) || [];

  const embed = new EmbedBuilder()
    .setTitle(`List for ${event.name}`)
    .setDescription(
      `UTC Date: ${formatEventUTCObj(event)}\nStatus: ${event.status}\n\nParticipants (${participants.length}):\n${participants.join("\n")}` +
      (absent.length ? `\n\nAbsent (${absent.length}):\n${absent.join("\n")}` : "")
    )
    .setColor(STATUS_COLORS[event.status] ?? 0xffffff);

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

// -----------------------------
// UPDATE EMBED HANDLER
// -----------------------------
export async function updateEventEmbed(message: Message, eventId: string) {
  const guildId = message.guildId;
  if (!guildId) return;

  const events = await getEvents(guildId);
  const event = events.find(ev => ev.id.toString() === eventId.toString());
  if (!event) return;

  const { embed, rows } = createEventEmbedAndRows(event);
  await message.edit({ embeds: [embed], components: rows });
}