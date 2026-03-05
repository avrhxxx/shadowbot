// src/eventsPanel/eventsButtons/eventsCompare.ts
import { ButtonInteraction, StringSelectMenuInteraction, TextChannel } from "discord.js";
import * as EventStorage from "../eventStorage";
import path from "path";
import fs from "fs";
import { EventObject } from "../eventService";
import { formatEventUTC } from "../../utils/timeUtils";

/* =======================================================
   🔹 Single Event Compare Button
======================================================= */
export async function handleCompareButton(interaction: ButtonInteraction, eventId: string) {
  const guildId = interaction.guildId!;
  const events = await EventStorage.getEvents(guildId);
  const event = events.find(e => e.id === eventId);

  if (!event) {
    await interaction.reply({ content: "Event not found.", ephemeral: true });
    return;
  }

  await buildComparison(interaction, [event]);
}

/* =======================================================
   🔹 Compare Select Menu
======================================================= */
export async function handleCompareSelect(interaction: StringSelectMenuInteraction) {
  const guildId = interaction.guildId!;
  const events = await EventStorage.getEvents(guildId);
  const selectedIds = interaction.values;
  const selectedEvents = events.filter(e => selectedIds.includes(e.id));

  if (!selectedEvents.length) {
    await interaction.update({ content: "No events selected.", components: [] });
    return;
  }

  await buildComparison(interaction, selectedEvents);
}

/* =======================================================
   🔹 Download for Single Compare
======================================================= */
export async function handleCompareDownload(interaction: ButtonInteraction) {
  const guildId = interaction.guildId!;
  const events = await EventStorage.getEvents(guildId);
  const customId = (interaction as ButtonInteraction).customId;

  const eventId = customId.replace("compare_download_", "");
  const event = events.find(e => e.id === eventId);

  if (!event) {
    await interaction.reply({ content: "Event not found.", ephemeral: true });
    return;
  }

  await buildComparison(interaction, [event], true); // true = download mode
}

/* =======================================================
   🔹 Compare All Events
======================================================= */
export async function handleCompareAll(interaction: ButtonInteraction) {
  const guildId = interaction.guildId!;
  const events = await EventStorage.getEvents(guildId);

  if (!events.length) {
    await interaction.reply({ content: "No events to compare.", ephemeral: true });
    return;
  }

  await buildComparison(interaction, events);
}

/* =======================================================
   🔹 Compare All Events Download
======================================================= */
export async function handleCompareAllDownload(interaction: ButtonInteraction) {
  const guildId = interaction.guildId!;
  const events = await EventStorage.getEvents(guildId);

  if (!events.length) {
    await interaction.reply({ content: "No events to download.", ephemeral: true });
    return;
  }

  await buildComparison(interaction, events, true); // true = download mode
}

/* =======================================================
   🔹 Build Comparison – wspólna funkcja
======================================================= */
export async function buildComparison(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  events: EventObject[],
  download = false
) {
  const guildId = interaction.guildId!;
  const config = await EventStorage.getConfig(guildId);
  const tempDir = path.join(__dirname, "../../temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  let fullMessage: string[] = [];

  events.forEach(event => {
    const statusLabel =
      event.status === "PAST" ? "[PAST]" :
      event.status === "CANCELED" ? "[CANCELED]" :
      "[ACTIVE]";

    const participants = event.participants.length ? event.participants.join("\n") : "None";
    const absent = event.absent?.length ? event.absent.join("\n") : "None";
    const dateStr = formatEventUTC(event.day, event.month, event.hour, event.minute, event.year);

    const eventText = [
      `Event: ${event.name}`,
      `Status: ${statusLabel}`,
      `Date: ${dateStr}`,
      `Participants:\n${participants}`,
      `Absent:\n${absent}`
    ].join("\n\n");

    fullMessage.push(eventText);
  });

  const finalMessage = fullMessage.join("\n\n====================\n\n");

  if (download) {
    if (!config.downloadChannelId) {
      await interaction.reply({ content: "Download channel not set.", ephemeral: true });
      return;
    }

    const channel = interaction.guild!.channels.cache.get(config.downloadChannelId) as TextChannel;
    const filePath = path.join(tempDir, `compare_${Date.now()}.txt`);
    fs.writeFileSync(filePath, finalMessage);

    await channel.send({
      content: `${finalMessage}\n\nYou can also download this as a TXT file attached below.`,
      files: [filePath]
    });

    await interaction.reply({ content: `Comparison file sent to <#${config.downloadChannelId}>.`, ephemeral: true });
  } else {
    await interaction.reply({ content: finalMessage, ephemeral: true });
  }
}