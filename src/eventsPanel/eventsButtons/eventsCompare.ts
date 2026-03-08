// src/eventsPanel/eventsButtons/eventsCompare.ts
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
import { EventObject, getEvents, getConfig } from "../eventService";
import { formatEventUTC } from "../../utils/timeUtils";

function formatEventUTCObj(e: EventObject) {
  return formatEventUTC(e.day, e.month, e.hour, e.minute, e.year);
}

function getMemberName(guild: Guild, id: string) {
  const member = guild.members.cache.get(id);
  return member ? member.displayName : id;
}

async function sendComparisonFile(channel: TextChannel, name: string, content: string) {
  const file = new AttachmentBuilder(Buffer.from(content, "utf-8"), { name });
  await channel.send({ content: `📥 ${name}`, files: [file] });
}

// -----------------------------
// BUTTON HANDLERS
// -----------------------------
export const handleCompareButton = async (
  interaction: ButtonInteraction,
  eventId: string
): Promise<void> => {
  const guild = interaction.guild as Guild;
  const events = await getEvents(interaction.guildId!);
  const current = events.find(e => e.id === eventId);
  if (!current) {
    await interaction.reply({ content: "Event not found.", ephemeral: true });
    return;
  }
  if (current.status !== "PAST") {
    await interaction.reply({ content: "You can only compare past events.", ephemeral: true });
    return;
  }

  const pastEvents = events.filter(e => e.status === "PAST" && e.id !== eventId).sort((a, b) => b.createdAt - a.createdAt);
  if (!pastEvents.length) {
    await interaction.reply({ content: "No other past events available to compare.", ephemeral: true });
    return;
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId(`compare_select_${eventId}`)
    .setPlaceholder("Select event to compare with")
    .addOptions(
      pastEvents.map(ev =>
        new StringSelectMenuOptionBuilder()
          .setLabel(ev.name)
          .setDescription(formatEventUTCObj(ev))
          .setValue(ev.id)
      )
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
  await interaction.reply({ content: `Select event to compare with **${current.name}**`, components: [row], ephemeral: true });
};

export const handleCompareSelect = async (
  interaction: StringSelectMenuInteraction
): Promise<void> => {
  const guild = interaction.guild as Guild;
  const selectedId = interaction.values[0];
  const currentId = interaction.customId.replace("compare_select_", "");
  const events = await getEvents(guild.id);
  const eventA = events.find(e => e.id === currentId);
  const eventB = events.find(e => e.id === selectedId);
  if (!eventA || !eventB) {
    await interaction.update({ content: "One of the events no longer exists.", components: [] });
    return;
  }

  const { embedText } = buildComparisonAB(eventA, eventB, guild);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`compare_download_${eventA.id}_${eventB.id}`)
      .setLabel("Download")
      .setStyle(ButtonStyle.Primary)
  );

  await interaction.update({ content: embedText, components: [row] });
};

export const handleCompareDownload = async (
  interaction: ButtonInteraction
): Promise<void> => {
  const guild = interaction.guild as Guild;
  const parts = interaction.customId.split("_");
  const idA = parts[2];
  const idB = parts[3];

  const events = await getEvents(guild.id);
  const eventA = events.find(e => e.id === idA);
  const eventB = events.find(e => e.id === idB);
  if (!eventA || !eventB) {
    await interaction.reply({ content: "Events not found.", ephemeral: true });
    return;
  }

  const { txtText } = buildComparisonAB(eventA, eventB, guild);
  const config = await getConfig(guild.id);

  const channelId = config?.downloadChannel;
  if (!channelId) {
    await interaction.reply({ content: "Download channel not set.", ephemeral: true });
    return;
  }

  const channel = guild.channels.cache.get(channelId) as TextChannel;
  if (!channel || !channel.isTextBased()) {
    await interaction.reply({ content: "Download channel invalid.", ephemeral: true });
    return;
  }

  await sendComparisonFile(channel, `compare_${eventA.name}_vs_${eventB.name}.txt`, txtText);
  await interaction.reply({ content: "Comparison sent to download channel.", ephemeral: true });
};

export const handleCompareAll = async (
  interaction: ButtonInteraction
): Promise<void> => {
  await interaction.deferReply({ ephemeral: true });
  const events = await getEvents(interaction.guildId!);
  if (!events.length) {
    await interaction.editReply({ content: "No events to compare.", components: [] });
    return;
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("compare_all_download")
      .setLabel("Download All (TXT)")
      .setStyle(ButtonStyle.Primary)
  );

  await interaction.editReply({ content: `📥 Comparison for all events ready. Click Download All (TXT) to get the file.`, components: [row] });
};

export const handleCompareAllDownload = async (
  interaction: ButtonInteraction
): Promise<void> => {
  await interaction.deferReply({ ephemeral: true });
  const guild = interaction.guild as Guild;
  const events = await getEvents(guild.id);
  if (!events.length) {
    await interaction.editReply({ content: "No events to download.", components: [] });
    return;
  }

  const { txtText } = buildComparisonAll(events, guild);
  const config = await getConfig(guild.id);

  const channelId = config?.downloadChannel;
  if (!channelId) {
    await interaction.editReply({ content: "Download channel not set.", components: [] });
    return;
  }

  const channel = guild.channels.cache.get(channelId) as TextChannel;
  if (!channel || !channel.isTextBased()) {
    await interaction.editReply({ content: "Download channel invalid.", components: [] });
    return;
  }

  const chunks = txtText.match(/[\s\S]{1,1900}/g) || [];
  for (const [i, chunk] of chunks.entries()) {
    await sendComparisonFile(channel, `compare_all_part_${i + 1}.txt`, chunk);
  }

  await interaction.editReply({ content: `Comparison for all events sent to <#${channelId}>`, components: [] });
};

// -----------------------------
// HELPERS
// -----------------------------
function buildComparisonAB(eventA: EventObject, eventB: EventObject, guild: Guild) {
  const participantsA = new Set(eventA.participants);
  const participantsB = new Set(eventB.participants);
  const absentA = new Set(eventA.absent || []);
  const absentB = new Set(eventB.absent || []);

  const reliable = [...participantsA].filter(id => participantsB.has(id));
  const missedOnce = [...participantsA].filter(id => absentB.has(id));
  const missedTwice = [...absentA].filter(id => absentB.has(id));

  const embedText =
    `Comparing:\nEvent A: ${eventA.name} (${formatEventUTCObj(eventA)})\nEvent B: ${eventB.name} (${formatEventUTCObj(eventB)})\n\n` +
    `🟢 Reliable (${reliable.length})\n${reliable.length ? reliable.map(id => getMemberName(guild, id)).join("\n") : "None"}\n\n` +
    `🟡 Missed Once (${missedOnce.length})\n${missedOnce.length ? missedOnce.map(id => getMemberName(guild, id)).join("\n") : "None"}\n\n` +
    `🔴 Missed Twice (${missedTwice.length})\n${missedTwice.length ? missedTwice.map(id => getMemberName(guild, id)).join("\n") : "None"}`;

  const txtText =
    `Attendance Comparison\n=====================\n\nEvent A: ${eventA.name} (${formatEventUTCObj(eventA)})\nEvent B: ${eventB.name} (${formatEventUTCObj(eventB)})\n\n` +
    `Reliable (${reliable.length})\n${reliable.length ? reliable.map(id => getMemberName(guild, id)).join("\n") : ""}\n\n` +
    `Missed Once (${missedOnce.length})\n${missedOnce.length ? missedOnce.map(id => getMemberName(guild, id)).join("\n") : ""}\n\n` +
    `Missed Twice (${missedTwice.length})\n${missedTwice.length ? missedTwice.map(id => getMemberName(guild, id)).join("\n") : ""}`;

  return { embedText, txtText };
}

function buildComparisonAll(events: EventObject[], guild: Guild) {
  const allParticipants = new Set<string>();
  events.forEach(ev => {
    ev.participants.forEach(p => allParticipants.add(p));
    (ev.absent || []).forEach(a => allParticipants.add(a));
  });

  const participants = [...allParticipants];
  const txtLines: string[] = [];

  participants.forEach(memberId => {
    const name = getMemberName(guild, memberId);
    let attended = 0;
    const block: string[] = [];
    events.forEach(ev => {
      let status = "-";
      if (ev.participants.includes(memberId)) {
        status = "✓";
        attended++;
      } else if (ev.absent?.includes(memberId)) {
        status = "✗";
      }
      block.push(`${ev.name}  ${status}`);
    });
    txtLines.push(`${name}\n${block.join("\n")}\nAttendance: ${attended}/${events.length} (${Math.round((attended/events.length)*100)}%)\n`);
  });

  return {
    embedText: `All Events Comparison\n\`\`\`\n${txtLines.join("\n----------------------\n\n")}\n\`\`\``,
    txtText: `All Events Comparison\n\n${txtLines.join("\n----------------------\n\n")}`
  };
}