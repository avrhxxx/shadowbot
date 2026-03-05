// src/eventsPanel/eventsButtons/eventsCompare.ts
import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
  Guild,
  AttachmentBuilder,
  TextChannel,
} from "discord.js";
import * as EventStorage from "../eventStorage";
import { EventObject } from "../eventService";

/* ===================================================== */
/*  HELPERS                                             */
/* ===================================================== */
function formatEventUTCObj(e: EventObject) {
  return `${e.day}/${e.month}/${e.year ?? ""} ${e.hour}:${e.minute}`;
}

/* ===================================================== */
/*  COMPARE SINGLE LOGIC                                 */
/* ===================================================== */

// Cache dla pojedynczego Compare Download (key = customId przycisku)
const compareCache: Map<string, { txtText: string; guildId: string }> = new Map();

// 1️⃣ Handle Compare Button (pierwszy klik)
export async function handleCompareButton(interaction: ButtonInteraction, eventId: string) {
  const guildId = interaction.guildId!;
  const events = await EventStorage.getEvents(guildId);

  const firstEvent = events.find(e => e.id === eventId);
  if (!firstEvent) {
    await interaction.reply({ content: "Event not found.", ephemeral: true });
    return;
  }

  // Tworzymy select menu dla drugiego eventu
  const otherEvents = events.filter(e => e.id !== eventId);
  if (!otherEvents.length) {
    await interaction.reply({ content: "No other events to compare with.", ephemeral: true });
    return;
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId(`compare_select_${eventId}`)
    .setPlaceholder("Select event to compare with")
    .addOptions(
      otherEvents.map(e => 
        new StringSelectMenuOptionBuilder()
          .setLabel(e.name)
          .setValue(e.id)
      )
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  await interaction.reply({
    content: `Select an event to compare with **${firstEvent.name}**:`,
    components: [row],
    ephemeral: true,
  });
}

// 2️⃣ Handle Compare Select (wybrany drugi event)
export async function handleCompareSelect(interaction: StringSelectMenuInteraction) {
  const guildId = interaction.guildId!;
  const events = await EventStorage.getEvents(guildId);

  const firstEventId = interaction.customId.replace("compare_select_", "");
  const secondEventId = interaction.values[0];

  const firstEvent = events.find(e => e.id === firstEventId);
  const secondEvent = events.find(e => e.id === secondEventId);

  if (!firstEvent || !secondEvent) {
    await interaction.update({ content: "Selected events not found.", components: [] });
    return;
  }

  const { embedText, txtText } = await buildComparison(firstEvent, secondEvent, interaction.guild!);

  // Tworzymy przycisk Download dla tego porównania
  const downloadBtn = new ButtonBuilder()
    .setCustomId(`compare_download_${Date.now()}`)
    .setLabel("Download")
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(downloadBtn);

  // Zapamiętujemy w cache
  compareCache.set(downloadBtn.data.customId!, { txtText, guildId });

  await interaction.update({ content: embedText, components: [row] });
}

// 3️⃣ Handle Compare Download (dla pojedynczego porównania)
export async function handleCompareDownload(interaction: ButtonInteraction) {
  const data = compareCache.get(interaction.customId);
  if (!data) {
    await interaction.reply({ content: "Comparison not found.", ephemeral: true });
    return;
  }

  const { txtText, guildId } = data;
  const config = await EventStorage.getConfig(guildId);
  if (!config?.downloadChannelId) {
    await interaction.reply({ content: "Download channel not configured.", ephemeral: true });
    return;
  }

  const channel = interaction.guild!.channels.cache.get(config.downloadChannelId) as TextChannel;
  if (!channel || !channel.isTextBased()) {
    await interaction.reply({ content: "Download channel invalid.", ephemeral: true });
    return;
  }

  const file = new AttachmentBuilder(Buffer.from(txtText, "utf-8"), {
    name: `compare_events_${Date.now()}.txt`,
  });

  await channel.send({ files: [file] });
  await interaction.reply({ content: `Comparison sent to <#${config.downloadChannelId}>.`, ephemeral: true });

  // Usuń z cache
  compareCache.delete(interaction.customId);
}

/* ===================================================== */
/*  COMPARE ALL LOGIC                                    */
/* ===================================================== */

// Cache dla Compare All
const compareAllCache: Map<string, { txtText: string; guildId: string }> = new Map();

// Handle Compare All Button
export async function handleCompareAll(interaction: ButtonInteraction) {
  const guildId = interaction.guildId!;
  const events = await EventStorage.getEvents(guildId);

  const pastEvents = events.filter(e => e.status === "PAST");
  if (!pastEvents.length) {
    await interaction.reply({ content: "No past events to compare.", ephemeral: true });
    return;
  }

  const { embedText, txtText } = buildCompareAll(pastEvents, interaction.guild!);

  const downloadBtn = new ButtonBuilder()
    .setCustomId(`compare_all_download_${Date.now()}`)
    .setLabel("Download")
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(downloadBtn);

  await interaction.reply({ content: embedText, components: [row], ephemeral: true });

  compareAllCache.set(downloadBtn.data.customId!, { txtText, guildId });
}

// Handle Compare All Download
export async function handleCompareAllDownload(interaction: ButtonInteraction) {
  const data = compareAllCache.get(interaction.customId);
  if (!data) {
    await interaction.reply({ content: "Comparison not found.", ephemeral: true });
    return;
  }

  const { txtText, guildId } = data;
  const config = await EventStorage.getConfig(guildId);
  if (!config?.downloadChannelId) {
    await interaction.reply({ content: "Download channel not configured.", ephemeral: true });
    return;
  }

  const channel = interaction.guild!.channels.cache.get(config.downloadChannelId) as TextChannel;
  if (!channel || !channel.isTextBased()) {
    await interaction.reply({ content: "Download channel invalid.", ephemeral: true });
    return;
  }

  const file = new AttachmentBuilder(Buffer.from(txtText, "utf-8"), {
    name: `compare_all_events_${Date.now()}.txt`,
  });

  await channel.send({ files: [file] });
  await interaction.reply({ content: `Comparison sent to <#${config.downloadChannelId}>.`, ephemeral: true });

  compareAllCache.delete(interaction.customId);
}

/* ===================================================== */
/*  BUILD COMPARE ALL TEXT                                */
/* ===================================================== */
function buildCompareAll(events: EventObject[], guild: Guild) {
  const lines: string[] = [];
  const getMemberName = (id: string) => guild.members.cache.get(id)?.displayName ?? id;

  events.forEach((event, idx) => {
    lines.push(`Event ${idx + 1}: ${event.name} (${formatEventUTCObj(event)})`);
    const participants = event.participants.length ? event.participants.map(getMemberName).join("\n") : "None";
    const absent = event.absent?.length ? event.absent.map(getMemberName).join("\n") : "None";
    lines.push(`Participants:\n${participants}\nAbsent:\n${absent}\n`);
  });

  const embedText = `📊 **Compare All Events**\n\n${lines.join("\n")}`;
  const txtText = lines.join("\n");

  return { embedText, txtText };
}

/* ===================================================== */
/*  BUILD COMPARISON FOR SINGLE EVENTS                   */
/* ===================================================== */
export async function buildComparison(eventA: EventObject, eventB: EventObject, guild: Guild) {
  const participantsA = new Set(eventA.participants);
  const participantsB = new Set(eventB.participants);
  const absentA = new Set(eventA.absent || []);
  const absentB = new Set(eventB.absent || []);

  const getMemberName = (id: string) => guild.members.cache.get(id)?.displayName ?? id;

  const reliable = [...participantsA].filter(id => participantsB.has(id));
  const missedOnce = [...participantsA].filter(id => absentB.has(id));
  const missedTwice = [...absentA].filter(id => absentB.has(id));

  const embedText =
    `Comparing:\nEvent A: ${eventA.name} (${formatEventUTCObj(eventA)})\nEvent B: ${eventB.name} (${formatEventUTCObj(eventB)})\n\n` +
    `🟢 Reliable (${reliable.length})\n` + (reliable.length ? reliable.map(getMemberName).join("\n") : "None") +
    `\n\n🟡 Missed Once (${missedOnce.length})\n` + (missedOnce.length ? missedOnce.map(getMemberName).join("\n") : "None") +
    `\n\n🔴 Missed Twice (${missedTwice.length})\n` + (missedTwice.length ? missedTwice.map(getMemberName).join("\n") : "None");

  const txtText =
    `Attendance Comparison\n=====================\n\nEvent A: ${eventA.name} (${formatEventUTCObj(eventA)})\nEvent B: ${eventB.name} (${formatEventUTCObj(eventB)})\n\n` +
    `Reliable (${reliable.length})\n` + (reliable.length ? reliable.map(getMemberName).join("\n") : "") +
    `\n\nMissed Once (${missedOnce.length})\n` + (missedOnce.length ? missedOnce.map(getMemberName).join("\n") : "") +
    `\n\nMissed Twice (${missedTwice.length})\n` + (missedTwice.length ? missedTwice.map(getMemberName).join("\n") : "");

  return { embedText, txtText };
}

/* ===================================================== */
/*  EXPORTS                                             */
/* ===================================================== */
export {
  handleCompareButton,
  handleCompareSelect,
  handleCompareDownload,
  handleCompareAll,
  handleCompareAllDownload,
  buildComparison,
};