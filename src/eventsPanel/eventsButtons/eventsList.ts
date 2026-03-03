import { ButtonInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel, AttachmentBuilder } from "discord.js";
import * as EventStorage from "../eventStorage";
import { EventObject } from "../eventService";
import path from "path";
import fs from "fs";

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

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  for (let i = 0; i < events.length; i++) {
    const e = events[i];

    const participantsList = e.participants.length
      ? e.participants.join(", ")
      : "None";

    const absentList = e.absent && e.absent.length
      ? e.absent.join(", ")
      : null;

    const dateStr = `${pad(e.day)}/${pad(e.month)} ${pad(e.hour)}:${pad(e.minute)}`;

    const embed = new EmbedBuilder()
      .setTitle(e.name)
      .setDescription(
        `Status: ${e.status}\nDate: ${dateStr}\nParticipants (${e.participants.length}): ${participantsList}` +
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
        .setCustomId(`event_download_single_${e.id}`)
        .setLabel("Download")
        .setStyle(ButtonStyle.Primary)
    );

    if (i === 0) {
      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    } else {
      await interaction.followUp({ embeds: [embed], components: [row], ephemeral: true });
    }
  }
}

/**
 * Download participant lists to configured channel
 * Generates TXT files + also posts the list in the channel
 */
export async function handleDownload(interaction: ButtonInteraction, singleEventId?: string) {
  if (!interaction.isButton()) return;
  const guildId = interaction.guildId;
  if (!guildId) return;

  const allEvents: EventObject[] = await EventStorage.getEvents(guildId);
  const events: EventObject[] = singleEventId
    ? allEvents.filter(e => e.id === singleEventId)
    : allEvents;

  if (!events.length) {
    await interaction.reply({ content: "No events to download.", ephemeral: true });
    return;
  }

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

  const files: AttachmentBuilder[] = [];

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  for (const event of events) {
    const statusLabel =
      event.status === "PAST"
        ? "[PAST]"
        : event.status === "CANCELED"
        ? "[CANCELED]"
        : "[ACTIVE]";

    const participants = event.participants.length
      ? event.participants.join("\n")
      : "None";

    const absent = event.absent?.length
      ? event.absent.join("\n")
      : "None";

    const dateStr = `${pad(event.day)}/${pad(event.month)} ${pad(event.hour)}:${pad(event.minute)}`;

    const content = [
      `Event: ${event.name}`,
      `Status: ${statusLabel}`,
      `Date: ${dateStr}`,
      `Participants:\n${participants}`,
      `Absent:\n${absent}`,
      `\nYou can also download this as a TXT file attached below.`
    ].join("\n\n");

    const filePath = path.join(tempDir, `${event.id}.txt`);
    fs.writeFileSync(filePath, content);
    files.push(new AttachmentBuilder(filePath));

    await channel.send({ content, files: [new AttachmentBuilder(filePath)] });
  }

  await interaction.reply({
    content: singleEventId
      ? `Participant file for event **${singleEventId}** sent to <#${config.downloadChannelId}>.`
      : `Participant files for all events sent to <#${config.downloadChannelId}>.`,
    ephemeral: true
  });
}