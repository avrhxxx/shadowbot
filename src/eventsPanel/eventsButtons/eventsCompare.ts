
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
import * as EventStorage from "../eventStorage";
import { EventObject } from "../eventService";
import { formatEventUTC } from "../../utils/timeUtils";
import { isHeavyLoad, sendHeavyReport } from "../eventsHelpers/heavyReportHelper";

// ==========================
// HELPERS
// ==========================
function formatEventUTCObj(e: EventObject) {
  return formatEventUTC(e.day, e.month, e.hour, e.minute, e.year);
}

function getMemberName(guild: Guild, id: string) {
  const member = guild.members.cache.get(id);
  return member ? member.displayName : id;
}

// ==========================
// SINGLE COMPARE
// ==========================
export async function handleCompareButton(interaction: ButtonInteraction, eventId: string) {
  const guildId = interaction.guildId!;
  const events: EventObject[] = await EventStorage.getEvents(guildId);
  const currentEvent = events.find(e => e.id === eventId);
  if (!currentEvent) return interaction.reply({ content: "Event not found.", ephemeral: true });
  if (currentEvent.status !== "PAST") return interaction.reply({ content: "You can only compare past events.", ephemeral: true });

  const pastEvents = events.filter(e => e.status === "PAST" && e.id !== eventId).sort((a, b) => b.createdAt - a.createdAt);
  if (!pastEvents.length) return interaction.reply({ content: "No other past events available to compare.", ephemeral: true });

  const select = new StringSelectMenuBuilder()
    .setCustomId(`compare_select_${eventId}`)
    .setPlaceholder("Select event to compare with")
    .addOptions(pastEvents.map(ev => new StringSelectMenuOptionBuilder().setLabel(ev.name).setDescription(formatEventUTCObj(ev)).setValue(ev.id)));

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  await interaction.reply({ content: `Select event to compare with **${currentEvent.name}**`, components: [row], ephemeral: true });
}

// ==========================
// HANDLE SELECT
// ==========================
export async function handleCompareSelect(interaction: StringSelectMenuInteraction) {
  const guild = interaction.guild as Guild;
  const guildId = guild.id;

  const selectedEventId = interaction.values[0];
  const currentEventId = interaction.customId.replace("compare_select_", "");

  const events: EventObject[] = await EventStorage.getEvents(guildId);
  const eventA = events.find(e => e.id === currentEventId);
  const eventB = events.find(e => e.id === selectedEventId);

  if (!eventA || !eventB) return interaction.update({ content: "One of the events no longer exists.", components: [] });

  const result = buildComparisonAB(eventA, eventB, guild);

  const downloadBtn = new ButtonBuilder().setCustomId(`compare_download_${eventA.id}_${eventB.id}`).setLabel("Download").setStyle(ButtonStyle.Primary);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(downloadBtn);

  await interaction.update({ content: result.embedText, components: [row] });
}

// ==========================
// DOWNLOAD A vs B
// ==========================
export async function handleCompareDownload(interaction: ButtonInteraction) {
  const guild = interaction.guild as Guild;
  const guildId = guild.id;

  const [_, __, eventAId, eventBId] = interaction.customId.split("_");
  const events: EventObject[] = await EventStorage.getEvents(guildId);
  const eventA = events.find(e => e.id === eventAId);
  const eventB = events.find(e => e.id === eventBId);
  if (!eventA || !eventB) return interaction.reply({ content: "Events not found.", ephemeral: true });

  const result = buildComparisonAB(eventA, eventB, guild);
  const config = await EventStorage.getConfig(guildId);
  if (!config?.downloadChannelId) return interaction.reply({ content: "Download channel not configured.", ephemeral: true });

  const channel = guild.channels.cache.get(config.downloadChannelId) as TextChannel;
  if (!channel || !channel.isTextBased()) return interaction.reply({ content: "Download channel invalid.", ephemeral: true });

  await channel.send({ content: `📥 Attendance comparison (UTC: ${new Date().toISOString()}):\n${result.embedText}` });
  const file = new AttachmentBuilder(Buffer.from(result.txtText, "utf-8"), { name: `compare_${eventA.name}_vs_${eventB.name}.txt` });
  await channel.send({ files: [file] });

  await interaction.reply({ content: "Comparison sent to download channel.", ephemeral: true });
}

// ==========================
// COMPARE ALL
// ==========================
export async function handleCompareAll(interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true });
  const guild = interaction.guild as Guild;
  const guildId = guild.id;
  const events: EventObject[] = await EventStorage.getEvents(guildId);

  if (!events.length) return interaction.editReply({ content: "No events to compare.", components: [] });

  if (isHeavyLoad(events)) {
    await sendHeavyReport(guild, events, (await EventStorage.getConfig(guildId))?.downloadChannelId);
    return interaction.editReply({ content: "Heavy report sent.", components: [] });
  }

  const result = buildComparisonAll(events, guild);
  const downloadBtn = new ButtonBuilder().setCustomId("compare_all_download").setLabel("Download").setStyle(ButtonStyle.Primary);
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(downloadBtn);

  await interaction.editReply({ content: result.embedText, components: [row] });
}

export async function handleCompareAllDownload(interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true });
  const guild = interaction.guild as Guild;
  const guildId = guild.id;
  const events: EventObject[] = await EventStorage.getEvents(guildId);

  if (!events.length) return interaction.editReply({ content: "No events to download.", components: [] });

  if (isHeavyLoad(events)) {
    await sendHeavyReport(guild, events, (await EventStorage.getConfig(guildId))?.downloadChannelId);
    return interaction.editReply({ content: "Heavy report sent.", components: [] });
  }

  const result = buildComparisonAll(events, guild);
  const config = await EventStorage.getConfig(guildId);
  const channel = guild.channels.cache.get(config?.downloadChannelId!) as TextChannel;
  if (!channel || !channel.isTextBased()) return interaction.editReply({ content: "Download channel invalid.", components: [] });

  const file = new AttachmentBuilder(Buffer.from(result.txtText, "utf-8"), { name: `compare_all_events.txt` });
  await channel.send({ content: `📥 Attendance comparison for all events (UTC: ${new Date().toISOString()}):\n${result.embedText}`, files: [file] });
  await interaction.editReply({ content: "Comparison sent to download channel.", components: [] });
}

// ==========================
// LOGIC
// ==========================
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
  let embedLines: string[] = [];
  let txtLines: string[] = [];

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
    const percent = Math.round((attended / events.length) * 100);
    const textBlock = `${name}\n${block.join("\n")}\nAttendance: ${attended}/${events.length} (${percent}%)\n`;
    embedLines.push(textBlock);
    txtLines.push(textBlock);
  });

  return {
    embedText: `All Events Comparison\n\`\`\`\n${embedLines.join("\n----------------------\n\n")}\n\`\`\``,
    txtText: `All Events Comparison\n\n${txtLines.join("\n----------------------\n\n")}`
  };
}