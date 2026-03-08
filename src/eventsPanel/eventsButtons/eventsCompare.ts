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
import { EventObject, getEvents, saveEvents, getConfig } from "../eventService";
import { formatEventUTC } from "../../utils/timeUtils";

// ==========================
// HELPERS
// ==========================
const formatEventUTCObj = (e: EventObject) => formatEventUTC(e.day, e.month, e.hour, e.minute, e.year);

const getMemberName = (guild: Guild, id: string) => guild.members.cache.get(id)?.displayName || id;

const mapAttendance = (event: EventObject) => ({
  participants: new Set(event.participants),
  absent: new Set(event.absent || [])
});

const formatComparisonText = (members: string[], title: string, guild: Guild) =>
  members.length ? members.map(id => getMemberName(guild, id)).join("\n") : "None";

// ==========================
// SINGLE COMPARE
// ==========================
export async function handleCompareButton(interaction: ButtonInteraction, eventId: string) {
  const guildId = interaction.guildId!;
  const events = await getEvents(guildId);
  const currentEvent = events.find(e => e.id === eventId);
  if (!currentEvent) return interaction.reply({ content: "Event not found.", ephemeral: true });
  if (currentEvent.status !== "PAST") return interaction.reply({ content: "You can only compare past events.", ephemeral: true });

  const pastEvents = events.filter(e => e.status === "PAST" && e.id !== eventId)
    .sort((a, b) => b.createdAt - a.createdAt);

  if (!pastEvents.length) return interaction.reply({ content: "No other past events available to compare.", ephemeral: true });

  const select = new StringSelectMenuBuilder()
    .setCustomId(`compare_select_${eventId}`)
    .setPlaceholder("Select event to compare with")
    .addOptions(pastEvents.map(ev => new StringSelectMenuOptionBuilder().setLabel(ev.name).setDescription(formatEventUTCObj(ev)).setValue(ev.id)));

  await interaction.reply({
    content: `Select event to compare with **${currentEvent.name}**`,
    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)],
    ephemeral: true
  });
}

// ==========================
// HANDLE SELECT
// ==========================
export async function handleCompareSelect(interaction: StringSelectMenuInteraction) {
  const guild = interaction.guild as Guild;
  const guildId = guild.id;

  const selectedEventId = interaction.values[0];
  const currentEventId = interaction.customId.replace("compare_select_", "");

  const events = await getEvents(guildId);
  const eventA = events.find(e => e.id === currentEventId);
  const eventB = events.find(e => e.id === selectedEventId);

  if (!eventA || !eventB) return interaction.update({ content: "One of the events no longer exists.", components: [] });

  const { embedText, txtText } = buildComparisonAB(eventA, eventB, guild);

  await interaction.update({
    content: embedText,
    components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`compare_download_${eventA.id}_${eventB.id}`).setLabel("Download").setStyle(ButtonStyle.Primary)
    )]
  });
}

// ==========================
// DOWNLOAD A vs B
// ==========================
export async function handleCompareDownload(interaction: ButtonInteraction) {
  const guild = interaction.guild as Guild;
  const guildId = guild.id;

  const [_, __, eventAId, eventBId] = interaction.customId.split("_");
  const events = await getEvents(guildId);
  const eventA = events.find(e => e.id === eventAId);
  const eventB = events.find(e => e.id === eventBId);
  if (!eventA || !eventB) return interaction.reply({ content: "Events not found.", ephemeral: true });

  const { embedText, txtText } = buildComparisonAB(eventA, eventB, guild);
  const config = await getConfig(guildId);
  const channel = guild.channels.cache.get(config?.downloadChannelId!) as TextChannel;
  if (!channel || !channel.isTextBased()) return interaction.reply({ content: "Download channel invalid.", ephemeral: true });

  await channel.send({ content: `📥 Attendance comparison (UTC: ${new Date().toISOString()}):\n${embedText}` });
  await channel.send({ files: [new AttachmentBuilder(Buffer.from(txtText, "utf-8"), { name: `compare_${eventA.name}_vs_${eventB.name}.txt` })] });

  await interaction.reply({ content: "Comparison sent to download channel.", ephemeral: true });
}

// ==========================
// COMPARE ALL
// ==========================
export async function handleCompareAll(interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true });
  const guild = interaction.guild as Guild;
  const events = await getEvents(guild.id);
  if (!events.length) return interaction.editReply({ content: "No events to compare.", components: [] });

  await interaction.editReply({
    content: `📥 Comparison for all events ready. Click Download All (TXT) to get the file.`,
    components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("compare_all_download").setLabel("Download All (TXT)").setStyle(ButtonStyle.Primary)
    )]
  });
}

export async function handleCompareAllDownload(interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true });
  const guild = interaction.guild as Guild;
  const events = await getEvents(guild.id);
  if (!events.length) return interaction.editReply({ content: "No events to download.", components: [] });

  const { txtText } = buildComparisonAll(events, guild);
  const config = await getConfig(guild.id);
  const channel = guild.channels.cache.get(config?.downloadChannelId!) as TextChannel;
  if (!channel || !channel.isTextBased()) return interaction.editReply({ content: "Download channel invalid.", components: [] });

  const txtChunks = txtText.match(/[\s\S]{1,1900}/g) || [];
  for (let i = 0; i < txtChunks.length; i++) {
    const file = new AttachmentBuilder(Buffer.from(txtChunks[i], "utf-8"), { name: `compare_all_part_${i + 1}.txt` });
    await channel.send({ content: `📥 Attendance comparison for all events (part ${i + 1} of ${txtChunks.length})`, files: [file] });
  }

  await interaction.editReply({ content: `Comparison for all events sent to <#${config?.downloadChannelId}>`, components: [] });
}

// ==========================
// LOGIC
// ==========================
function buildComparisonAB(eventA: EventObject, eventB: EventObject, guild: Guild) {
  const { participants: participantsA, absent: absentA } = mapAttendance(eventA);
  const { participants: participantsB, absent: absentB } = mapAttendance(eventB);

  const reliable = [...participantsA].filter(id => participantsB.has(id));
  const missedOnce = [...participantsA].filter(id => absentB.has(id));
  const missedTwice = [...absentA].filter(id => absentB.has(id));

  const embedText =
    `Comparing:\nEvent A: ${eventA.name} (${formatEventUTCObj(eventA)})\nEvent B: ${eventB.name} (${formatEventUTCObj(eventB)})\n\n` +
    `🟢 Reliable (${reliable.length})\n${formatComparisonText(reliable, "Reliable", guild)}\n\n` +
    `🟡 Missed Once (${missedOnce.length})\n${formatComparisonText(missedOnce, "Missed Once", guild)}\n\n` +
    `🔴 Missed Twice (${missedTwice.length})\n${formatComparisonText(missedTwice, "Missed Twice", guild)}`;

  const txtText =
    `Attendance Comparison\n=====================\n\nEvent A: ${eventA.name} (${formatEventUTCObj(eventA)})\nEvent B: ${eventB.name} (${formatEventUTCObj(eventB)})\n\n` +
    `Reliable (${reliable.length})\n${formatComparisonText(reliable, "Reliable", guild)}\n\n` +
    `Missed Once (${missedOnce.length})\n${formatComparisonText(missedOnce, "Missed Once", guild)}\n\n` +
    `Missed Twice (${missedTwice.length})\n${formatComparisonText(missedTwice, "Missed Twice", guild)}`;

  return { embedText, txtText };
}

function buildComparisonAll(events: EventObject[], guild: Guild) {
  const allParticipants = new Set<string>();
  events.forEach(ev => {
    ev.participants.forEach(p => allParticipants.add(p));
    (ev.absent || []).forEach(a => allParticipants.add(a));
  });

  const participants = [...allParticipants];
  const lines: string[] = participants.map(memberId => {
    const name = getMemberName(guild, memberId);
    let attended = 0;
    const block = events.map(ev => {
      let status = "-";
      if (ev.participants.includes(memberId)) { status = "✓"; attended++; }
      else if (ev.absent?.includes(memberId)) status = "✗";
      return `${ev.name}  ${status}`;
    });
    return `${name}\n${block.join("\n")}\nAttendance: ${attended}/${events.length} (${Math.round((attended/events.length)*100)}%)\n`;
  });

  return {
    embedText: `All Events Comparison\n\`\`\`\n${lines.join("\n----------------------\n\n")}\n\`\`\``,
    txtText: `All Events Comparison\n\n${lines.join("\n----------------------\n\n")}`
  };
}