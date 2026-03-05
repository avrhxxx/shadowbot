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

/* ===================================================== */
/*  HELPERS                                              */
/* ===================================================== */
function formatEventUTCObj(e: EventObject) {
  return formatEventUTC(e.day, e.month, e.hour, e.minute, e.year);
}

function getMemberName(guild: Guild, id: string) {
  const member = guild.members.cache.get(id);
  return member ? member.displayName : id;
}

/* ===================================================== */
/*  STEP 1 — SINGLE COMPARE BUTTON                       */
/* ===================================================== */
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

  const pastEvents = events
    .filter(e => e.status === "PAST" && e.id !== eventId)
    .sort((a, b) => b.createdAt - a.createdAt);

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

  await interaction.reply({
    content: `Select event to compare with **${currentEvent.name}**`,
    components: [row],
    ephemeral: true
  });
}

/* ===================================================== */
/*  STEP 2 — HANDLE SELECT MENU (A vs B)                */
/* ===================================================== */
export async function handleCompareSelect(interaction: StringSelectMenuInteraction) {
  const guild = interaction.guild as Guild;
  const guildId = guild.id;

  const selectedEventId = interaction.values[0];
  const currentEventId = interaction.customId.replace("compare_select_", "");

  const events: EventObject[] = await EventStorage.getEvents(guildId);
  const eventA = events.find(e => e.id === currentEventId);
  const eventB = events.find(e => e.id === selectedEventId);

  if (!eventA || !eventB) {
    await interaction.update({ content: "One of the events no longer exists.", components: [] });
    return;
  }

  const result = buildComparisonAB(eventA, eventB, guild);

  const downloadBtn = new ButtonBuilder()
    .setCustomId(`compare_download_${eventA.id}_${eventB.id}`)
    .setLabel("Download")
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(downloadBtn);

  await interaction.update({ content: result.embedText, components: [row] });
}

/* ===================================================== */
/*  STEP 3 — DOWNLOAD BUTTON (A vs B)                   */
/* ===================================================== */
export async function handleCompareDownload(interaction: ButtonInteraction) {
  const guild = interaction.guild as Guild;
  const guildId = guild.id;

  const parts = interaction.customId.split("_");
  const eventAId = parts[2];
  const eventBId = parts[3];

  const events: EventObject[] = await EventStorage.getEvents(guildId);
  const eventA = events.find(e => e.id === eventAId);
  const eventB = events.find(e => e.id === eventBId);

  if (!eventA || !eventB) {
    await interaction.reply({ content: "Events not found.", ephemeral: true });
    return;
  }

  const result = buildComparisonAB(eventA, eventB, guild);

  const config = await EventStorage.getConfig(guildId);
  if (!config?.downloadChannelId) {
    await interaction.reply({ content: "Download channel not configured.", ephemeral: true });
    return;
  }

  const channel = guild.channels.cache.get(config.downloadChannelId) as TextChannel;
  if (!channel || !channel.isTextBased()) {
    await interaction.reply({ content: "Download channel invalid.", ephemeral: true });
    return;
  }

  const utcNow = new Date().toISOString();
  await channel.send({ content: `📥 Attendance comparison (UTC: ${utcNow}):\n${result.embedText}` });

  const file = new AttachmentBuilder(Buffer.from(result.txtText, "utf-8"), {
    name: `compare_${eventA.name}_vs_${eventB.name}.txt`
  });
  await channel.send({ files: [file] });

  await interaction.reply({ content: "Comparison sent to download channel.", ephemeral: true });
}

/* ===================================================== */
/*  SINGLE COMPARE LOGIC (A vs B)                        */
/* ===================================================== */
function buildComparisonAB(eventA: EventObject, eventB: EventObject, guild: Guild) {
  const participantsA = new Set(eventA.participants);
  const participantsB = new Set(eventB.participants);
  const absentA = new Set(eventA.absent || []);
  const absentB = new Set(eventB.absent || []);

  const reliable = [...participantsA].filter(id => participantsB.has(id));
  const missedOnce = [...participantsA].filter(id => absentB.has(id));
  const missedTwice = [...absentA].filter(id => absentB.has(id));

  const embedText =
    `Comparing:\n` +
    `Event A: ${eventA.name} (${formatEventUTCObj(eventA)})\n` +
    `Event B: ${eventB.name} (${formatEventUTCObj(eventB)})\n\n` +
    `🟢 Reliable (${reliable.length})\n` +
    (reliable.length ? reliable.map(id => getMemberName(guild, id)).join("\n") : "None") +
    `\n\n🟡 Missed Once (${missedOnce.length})\n` +
    (missedOnce.length ? missedOnce.map(id => getMemberName(guild, id)).join("\n") : "None") +
    `\n\n🔴 Missed Twice (${missedTwice.length})\n` +
    (missedTwice.length ? missedTwice.map(id => getMemberName(guild, id)).join("\n") : "None");

  const txtText =
    `Attendance Comparison\n` +
    `=====================\n\n` +
    `Event A: ${eventA.name} (${formatEventUTCObj(eventA)})\n` +
    `Event B: ${eventB.name} (${formatEventUTCObj(eventB)})\n\n` +
    `Reliable (${reliable.length})\n` +
    (reliable.length ? reliable.map(id => getMemberName(guild, id)).join("\n") : "") +
    `\n\nMissed Once (${missedOnce.length})\n` +
    (missedOnce.length ? missedOnce.map(id => getMemberName(guild, id)).join("\n") : "") +
    `\n\nMissed Twice (${missedTwice.length})\n` +
    (missedTwice.length ? missedTwice.map(id => getMemberName(guild, id)).join("\n") : "");

  return { embedText, txtText };
}

/* ===================================================== */
/*  COMPARE ALL EVENTS                                     */
/* ===================================================== */
export async function handleCompareAll(interaction: ButtonInteraction) {
  const guild = interaction.guild as Guild;
  const guildId = guild.id;

  const events: EventObject[] = await EventStorage.getEvents(guildId);
  if (!events.length) {
    await interaction.reply({ content: "No events to compare.", ephemeral: true });
    return;
  }

  const result = buildComparisonAll(events, guild);

  const downloadBtn = new ButtonBuilder()
    .setCustomId("compare_all_download")
    .setLabel("Download")
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(downloadBtn);

  await interaction.reply({ content: result.embedText, components: [row], ephemeral: true });
}

export async function handleCompareAllDownload(interaction: ButtonInteraction) {
  const guild = interaction.guild as Guild;
  const guildId = guild.id;

  const events: EventObject[] = await EventStorage.getEvents(guildId);
  if (!events.length) {
    await interaction.reply({ content: "No events to download.", ephemeral: true });
    return;
  }

  const result = buildComparisonAll(events, guild);

  const config = await EventStorage.getConfig(guildId);
  if (!config?.downloadChannelId) {
    await interaction.reply({ content: "Download channel not configured.", ephemeral: true });
    return;
  }

  const channel = guild.channels.cache.get(config.downloadChannelId) as TextChannel;
  if (!channel || !channel.isTextBased()) {
    await interaction.reply({ content: "Download channel invalid.", ephemeral: true });
    return;
  }

  const utcNow = new Date().toISOString();
  await channel.send({ content: `📥 Attendance comparison for all events (UTC: ${utcNow}):\n${result.embedText}` });

  const file = new AttachmentBuilder(Buffer.from(result.txtText, "utf-8"), {
    name: `compare_all_events.txt`
  });
  await channel.send({ files: [file] });

  await interaction.reply({ content: "Comparison sent to download channel.", ephemeral: true });
}

/* ===================================================== */
/*  BUILD COMPARE ALL LOGIC                               */
/* ===================================================== */
function buildComparisonAll(events: EventObject[], guild: Guild) {
  const allParticipants = new Set<string>();
  events.forEach(ev => ev.participants.forEach(p => allParticipants.add(p)));

  let embedLines: string[] = [];
  let txtLines: string[] = [];

  allParticipants.forEach(memberId => {
    const row = events.map(ev => (ev.participants.includes(memberId) ? "🟢" : ev.absent?.includes(memberId) ? "🔴" : "⚪")).join(" | ");
    embedLines.push(`${memberId}: ${row}`);
    txtLines.push(`${memberId}: ${row}`);
  });

  const header = events.map(ev => ev.name).join(" | ");
  const embedText = `All Events Comparison:\n\n${header}\n` + embedLines.join("\n");
  const txtText = `All Events Comparison:\n\n${header}\n` + txtLines.join("\n");

  return { embedText, txtText };
}