import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Guild,
  TextChannel,
  AttachmentBuilder
} from "discord.js";
import * as EventStorage from "../eventStorage";
import { EventObject } from "../eventService";
import { formatUTCDate } from "../../utils/timeUtils";

function formatEventUTC(e: EventObject) {
  const year = new Date().getUTCFullYear();
  return formatUTCDate(e.day, e.month, year, e.hour, e.minute);
}

export async function handleCompareButton(interaction: ButtonInteraction, eventId: string) {
  const guildId = interaction.guildId!;
  const events: EventObject[] = await EventStorage.getEvents(guildId);

  const currentEvent = events.find(e => e.id === eventId);
  if (!currentEvent) {
    await interaction.reply({ content: "Event not found.", ephemeral: true });
    return;
  }
  if (currentEvent.status !== "PAST") {
    await interaction.reply({ content: "You can only compare past events.", ephemeral: true });
    return;
  }

  const pastEvents = events.filter(e => e.status === "PAST" && e.id !== eventId)
    .sort((a, b) => b.createdAt - a.createdAt);

  if (!pastEvents.length) {
    await interaction.reply({ content: "No other past events available to compare.", ephemeral: true });
    return;
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId(`compare_select_${eventId}`)
    .setPlaceholder("Select event to compare with")
    .addOptions(
      pastEvents.map(e =>
        new StringSelectMenuOptionBuilder()
          .setLabel(e.name)
          .setDescription(formatEventUTC(e))
          .setValue(e.id)
      )
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  await interaction.reply({ content: `Select event to compare with **${currentEvent.name}**`, components: [row], ephemeral: true });
}

export async function handleCompareSelect(interaction: StringSelectMenuInteraction) {
  const guild = interaction.guild as Guild;
  const guildId = guild.id;

  const selectedEventId = interaction.values[0];
  const currentEventId = interaction.customId.replace("compare_select_", "");

  const events: EventObject[] = await EventStorage.getEvents(guildId);
  const currentEvent = events.find(e => e.id === currentEventId);
  const selectedEvent = events.find(e => e.id === selectedEventId);

  if (!currentEvent || !selectedEvent) {
    await interaction.update({ content: "One of the events no longer exists.", components: [] });
    return;
  }

  const result = await buildComparison(selectedEvent, currentEvent, guild);

  const downloadButton = new ButtonBuilder()
    .setCustomId(`compare_download_${selectedEvent.id}_${currentEvent.id}`)
    .setLabel("Download")
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(downloadButton);

  await interaction.update({ content: result.embedText, components: [row] });
}

export async function handleCompareDownload(interaction: ButtonInteraction) {
  const guild = interaction.guild as Guild;
  const guildId = guild.id;

  const [ , , eventAId, eventBId ] = interaction.customId.split("_");

  const events: EventObject[] = await EventStorage.getEvents(guildId);
  const eventA = events.find(e => e.id === eventAId);
  const eventB = events.find(e => e.id === eventBId);

  if (!eventA || !eventB) {
    await interaction.reply({ content: "Events not found.", ephemeral: true });
    return;
  }

  const result = await buildComparison(eventA, eventB, guild);

  const config = await EventStorage.getConfig(guildId);
  if (!config?.downloadChannelId) {
    await interaction.reply({ content: "Download channel not configured.", ephemeral: true });
    return;
  }

  const channel = guild.channels.cache.get(config.downloadChannelId) as TextChannel;
  if (!channel?.isTextBased()) {
    await interaction.reply({ content: "Download channel invalid.", ephemeral: true });
    return;
  }

  const utcNow = new Date().toISOString();

  await channel.send({ content: `📥 Attendance comparison (UTC: ${utcNow}):\n${result.embedText}` });

  const file = new AttachmentBuilder(Buffer.from(result.txtText, "utf-8"), { name: `compare_${eventA.name}_vs_${eventB.name}.txt` });
  await channel.send({ content: `File version of the comparison:`, files: [file] });

  await interaction.reply({ content: "Comparison sent to download channel.", ephemeral: true });
}

async function buildComparison(eventA: EventObject, eventB: EventObject, guild: Guild) {
  const participantsA = new Set(eventA.participants);
  const participantsB = new Set(eventB.participants);
  const absentA = new Set(eventA.absent || []);
  const absentB = new Set(eventB.absent || []);

  const getMemberName = (id: string) => guild.members.cache.get(id)?.displayName || id;

  const reliable = [...participantsA].filter(id => participantsB.has(id));
  const missedOnce = [...participantsA].filter(id => absentB.has(id));
  const missedTwice = [...absentA].filter(id => absentB.has(id));

  const embedText =
    `Comparing:\nEvent A: ${eventA.name} (${formatEventUTC(eventA)})\nEvent B: ${eventB.name} (${formatEventUTC(eventB)})\n\n` +
    `🟢 Reliable (${reliable.length})\n${reliable.length ? reliable.map(getMemberName).join("\n") : "None"}\n\n` +
    `🟡 Missed Once (${missedOnce.length})\n${missedOnce.length ? missedOnce.map(getMemberName).join("\n") : "None"}\n\n` +
    `🔴 Missed Twice (${missedTwice.length})\n${missedTwice.length ? missedTwice.map(getMemberName).join("\n") : "None"}`;

  const txtText =
    `Attendance Comparison\n=====================\n\nEvent A: ${eventA.name} (${formatEventUTC(eventA)})\nEvent B: ${eventB.name} (${formatEventUTC(eventB)})\n\n` +
    `Reliable (${reliable.length})\n${reliable.length ? reliable.map(getMemberName).join("\n") : ""}\n\n` +
    `Missed Once (${missedOnce.length})\n${missedOnce.length ? missedOnce.map(getMemberName).join("\n") : ""}\n\n` +
    `Missed Twice (${missedTwice.length})\n${missedTwice.length ? missedTwice.map(getMemberName).join("\n") : ""}`;

  return { embedText, txtText };
}