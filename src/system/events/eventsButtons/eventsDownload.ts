import { ButtonInteraction, AttachmentBuilder, TextChannel } from "discord.js";
import { getEvents, getConfig, EventObject } from "../eventService";
import { formatEventUTC } from "../../utils/timeUtils";

async function getEventById(guildId: string, eventId: string): Promise<EventObject | null> {
  const events = await getEvents(guildId);
  const event = events.find(e => e.id.toString().trim() === eventId.toString().trim());
  return event || null;
}

export async function handleDownload(interaction: ButtonInteraction, singleEventId?: string) {
  if (!interaction.guild || !interaction.guildId) return;

  const guildId = interaction.guildId;
  const allEvents: EventObject[] = await getEvents(guildId);
  const config = await getConfig(guildId);

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
    const event = await getEventById(guildId, singleEventId);

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

    const date = formatEventUTC(event.day, event.month, event.hour, event.minute, event.year);

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
  // ALL EVENTS (tylko custom + reservoir)
  // -------------------------
  await interaction.deferReply({ ephemeral: true });

  const relevantEvents = allEvents.filter(e => ["custom", "reservoir_raid"].includes(e.eventType));

  if (!relevantEvents.length) {
    await interaction.editReply({
      content: "No events with participants to download.",
      components: []
    });
    return;
  }

  const blocks = relevantEvents.map(event => {
    const status =
      event.status === "PAST" ? "[PAST]" :
      event.status === "CANCELED" ? "[CANCELED]" :
      "[ACTIVE]";

    const participants = event.participants.length ? event.participants.join("\n") : "None";
    const absent = event.absent?.length ? event.absent.join("\n") : "None";

    const date = formatEventUTC(event.day, event.month, event.hour, event.minute, event.year);

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