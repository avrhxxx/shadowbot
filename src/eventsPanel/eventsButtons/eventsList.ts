import { ButtonInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel, AttachmentBuilder } from "discord.js";
import * as EventStorage from "../eventStorage";
import { EventObject } from "../eventService";
import path from "path";
import fs from "fs";

/**
 * Show ephemeral list of all events
 * Each event → separate embed with buttons
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
        (e.absent && e.absent.length ? `\nAbsent: ${e.absent.length}` : "")
      )
      .setColor(e.status === "ACTIVE" ? 0x00ff00 : e.status === "PAST" ? 0x808080 : 0xff0000);

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
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`event_compare_${e.id}`)
        .setLabel("Compare")
        .setStyle(ButtonStyle.Secondary) // placeholder
    );

    if (i === 0) {
      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    } else {
      await interaction.followUp({ embeds: [embed], components: [row], ephemeral: true });
    }
  }
}

/**
 * Download participant lists
 * singleEventId -> one event
 * otherwise -> all events in single file and message
 */
export async function handleDownload(interaction: ButtonInteraction, singleEventId?: string) {
  if (!interaction.isButton()) return;

  const guildId = interaction.guildId;
  if (!guildId) return;

  const allEvents: EventObject[] = await EventStorage.getEvents(guildId);
  const config: { downloadChannelId?: string } = await EventStorage.getConfig(guildId);

  if (!config.downloadChannelId) {
    await interaction.reply({ content: "Download channel is not set.", ephemeral: true });
    return;
  }

  const channel = interaction.guild!.channels.cache.get(config.downloadChannelId) as TextChannel | undefined;
  if (!channel || !channel.isTextBased()) {
    await interaction.reply({ content: "Download channel not found or not text-based.", ephemeral: true });
    return;
  }

  const tempDir = path.join(__dirname, "../../temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  if (singleEventId) {
    // Single event
    const event = allEvents.find(e => e.id === singleEventId);
    if (!event) {
      await interaction.reply({ content: "Event not found.", ephemeral: true });
      return;
    }

    const statusLabel = event.status === "PAST" ? "[PAST]" : event.status === "CANCELED" ? "[CANCELED]" : "[ACTIVE]";
    const participants = event.participants.length ? event.participants.join("\n") : "None";
    const absent = event.absent?.length ? event.absent.join("\n") : "None";
    const dateStr = `${pad(event.day)}/${pad(event.month)} ${pad(event.hour)}:${pad(event.minute)}`;

    const messageContent = [
      `Event: ${event.name}`,
      `Status: ${statusLabel}`,
      `Date: ${dateStr}`,
      `Participants:\n${participants}`,
      `Absent:\n${absent}`
    ].join("\n\n");

    const filePath = path.join(tempDir, `${event.id}.txt`);
    fs.writeFileSync(filePath, messageContent);

    const attachment = new AttachmentBuilder(filePath);
    await channel.send({ content: messageContent, files: [attachment] });

    await interaction.reply({
      content: `Participant file for event **${event.name}** sent to <#${config.downloadChannelId}>.`,
      ephemeral: true
    });
    return;
  }

  // All events -> single file + single message
  if (!allEvents.length) {
    await interaction.reply({ content: "No events to download.", ephemeral: true });
    return;
  }

  let fullMessage: string[] = [];
  allEvents.forEach(event => {
    const statusLabel = event.status === "PAST" ? "[PAST]" : event.status === "CANCELED" ? "[CANCELED]" : "[ACTIVE]";
    const participants = event.participants.length ? event.participants.join("\n") : "None";
    const absent = event.absent?.length ? event.absent.join("\n") : "None";
    const dateStr = `${pad(event.day)}/${pad(event.month)} ${pad(event.hour)}:${pad(event.minute)}`;

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
  const filePath = path.join(tempDir, `all_events_${Date.now()}.txt`);
  fs.writeFileSync(filePath, finalMessage);

  const attachment = new AttachmentBuilder(filePath);

  await channel.send({
    content: `Participant lists for all events:\n\n${finalMessage}`,
    files: [attachment]
  });

  await interaction.reply({
    content: `Participant lists for all events sent to <#${config.downloadChannelId}>.`,
    ephemeral: true
  });
}