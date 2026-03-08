// src/eventsPanel/eventsButtons/eventsDownload.ts
import { ButtonInteraction, AttachmentBuilder, TextChannel } from "discord.js";
import { getEvents, getConfig } from "../eventService";
import { EventObject } from "../eventService";
import { formatEventUTC } from "../../utils/timeUtils";

export async function handleDownload(interaction: ButtonInteraction, singleEventId?: string) {
  if (!interaction.guild || !interaction.guildId) return;

  const guildId = interaction.guildId;
  const allEvents: EventObject[] = await getEvents(guildId);
  const config = await getConfig(guildId);

  // ✅ poprawione pole configu
  if (!config || !config.downloadChannel) {
    await interaction.reply({
      content: "❌ Download channel is not set in event settings.",
      ephemeral: true
    });
    return;
  }

  const channel = interaction.guild.channels.cache.get(config.downloadChannel);

  if (!channel || !(channel instanceof TextChannel)) {
    await interaction.reply({
      content: "❌ Download channel not found or not a text channel.",
      ephemeral: true
    });
    return;
  }

  // -------------------------
  // SINGLE EVENT
  // -------------------------
  if (singleEventId) {
    const event = allEvents.find(e => e.id === singleEventId);

    if (!event) {
      await interaction.reply({ content: "Event not found.", ephemeral: true });
      return;
    }

    const status =
      event.status === "PAST" ? "[PAST]" :
      event.status === "CANCELED" ? "[CANCELED]" :
      "[ACTIVE]";

    const participants = event.participants.length ? event.participants.join("\n") : "None";
    const absent = event.absent?.length ? event.absent.join("\n") : "None";

    const date = formatEventUTC(
      event.day,
      event.month,
      event.hour,
      event.minute,
      event.year
    );

    const content = [
      `Event: ${event.name}`,
      `Status: ${status}`,
      `Date: ${date}`,
      `Participants:\n${participants}`,
      `Absent:\n${absent}`
    ].join("\n\n");

    const file = new AttachmentBuilder(
      Buffer.from(content, "utf8"),
      { name: `${event.id}.txt` }
    );

    await channel.send({
      content: `Participant list for **${event.name}**`,
      files: [file]
    });

    await interaction.reply({
      content: `Participant file sent to <#${config.downloadChannel}>.`,
      ephemeral: true
    });

    return;
  }

  // -------------------------
  // ALL EVENTS
  // -------------------------
  await interaction.deferReply({ ephemeral: true });

  if (!allEvents.length) {
    await interaction.editReply({
      content: "No events to download.",
      components: []
    });
    return;
  }

  const blocks = allEvents.map(event => {

    const status =
      event.status === "PAST" ? "[PAST]" :
      event.status === "CANCELED" ? "[CANCELED]" :
      "[ACTIVE]";

    const participants = event.participants.length ? event.participants.join("\n") : "None";
    const absent = event.absent?.length ? event.absent.join("\n") : "None";

    const date = formatEventUTC(
      event.day,
      event.month,
      event.hour,
      event.minute,
      event.year
    );

    return [
      `Event: ${event.name}`,
      `Status: ${status}`,
      `Date: ${date}`,
      `Participants:\n${participants}`,
      `Absent:\n${absent}`
    ].join("\n\n");

  });

  const file = new AttachmentBuilder(
    Buffer.from(blocks.join("\n\n====================\n\n"), "utf8"),
    { name: `all_events_${Date.now()}.txt` }
  );

  await channel.send({
    content: "All participant lists",
    files: [file]
  });

  await interaction.editReply({
    content: `Participant lists sent to <#${config.downloadChannel}>.`,
    components: []
  });
}