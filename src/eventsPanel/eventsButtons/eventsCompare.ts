// src/eventsPanel/eventsButtons/eventsCompare.ts
import {
  ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Guild,
  TextChannel,
  AttachmentBuilder,
} from "discord.js";
import * as EventStorage from "../eventStorage";
import { EventObject } from "../eventService";
import { formatEventUTC } from "../../utils/timeUtils";

/**
 * Formatuje EventObject (z uwzględnieniem roku)
 */
function formatEventUTCObj(e: EventObject) {
  return formatEventUTC(e.day, e.month, e.hour, e.minute, e.year);
}

/* ===================================================== */
/*  COMPARE ALL BUTTON                                    */
/* ===================================================== */
export async function handleCompareAll(interaction: ButtonInteraction) {
  const guildId = interaction.guildId!;
  const events: EventObject[] = await EventStorage.getEvents(guildId);

  const pastEvents = events.filter(e => e.status === "PAST");

  if (!pastEvents.length) {
    await interaction.reply({ content: "No past events to compare.", ephemeral: true });
    return;
  }

  // 🔹 budujemy pełne porównanie wszystkich pastEvents
  const { embedText, txtText } = buildCompareAll(pastEvents, interaction.guild!);

  // 🔹 przycisk download
  const downloadBtn = new ButtonBuilder()
    .setCustomId(`compare_all_download_${Date.now()}`)
    .setLabel("Download")
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(downloadBtn);

  await interaction.reply({
    content: embedText,
    components: [row],
    ephemeral: true,
  });

  // 🔹 tymczasowe przechowanie txtText w mapie, żeby Download button wiedział, co wysłać
  compareAllCache.set(downloadBtn.data.custom_id!, { txtText, guildId });
}

// 🔹 Cache dla Compare All (key = customId przycisku)
const compareAllCache: Map<string, { txtText: string; guildId: string }> = new Map();

/* ===================================================== */
/*  HANDLE DOWNLOAD BUTTON FOR COMPARE ALL               */
/* ===================================================== */
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

  // 🔹 usuń z cache po wysłaniu
  compareAllCache.delete(interaction.customId);
}

/* ===================================================== */
/*  BUILD COMPARE ALL TEXT                                */
/* ===================================================== */
function buildCompareAll(events: EventObject[], guild: Guild) {
  const lines: string[] = [];
  const getMemberName = (id: string) => {
    const member = guild.members.cache.get(id);
    return member ? member.displayName : id;
  };

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
/*  EXISTING buildComparison (pojedyncze eventy)         */
/* ===================================================== */
export async function buildComparison(eventA: EventObject, eventB: EventObject, guild: Guild) {
  const participantsA = new Set(eventA.participants);
  const participantsB = new Set(eventB.participants);
  const absentA = new Set(eventA.absent || []);
  const absentB = new Set(eventB.absent || []);

  const getMemberName = (id: string) => {
    const member = guild.members.cache.get(id);
    return member ? member.displayName : id;
  };

  const reliable = [...participantsA].filter(id => participantsB.has(id));
  const missedOnce = [...participantsA].filter(id => absentB.has(id));
  const missedTwice = [...absentA].filter(id => absentB.has(id));

  const embedText =
    `Comparing:\n` +
    `Event A: ${eventA.name} (${formatEventUTCObj(eventA)})\n` +
    `Event B: ${eventB.name} (${formatEventUTCObj(eventB)})\n\n` +
    `🟢 Reliable (${reliable.length})\n` +
    (reliable.length ? reliable.map(getMemberName).join("\n") : "None") +
    `\n\n🟡 Missed Once (${missedOnce.length})\n` +
    (missedOnce.length ? missedOnce.map(getMemberName).join("\n") : "None") +
    `\n\n🔴 Missed Twice (${missedTwice.length})\n` +
    (missedTwice.length ? missedTwice.map(getMemberName).join("\n") : "None");

  const txtText =
    `Attendance Comparison\n` +
    `=====================\n\n` +
    `Event A: ${eventA.name} (${formatEventUTCObj(eventA)})\n` +
    `Event B: ${eventB.name} (${formatEventUTCObj(eventB)})\n\n` +
    `Reliable (${reliable.length})\n` +
    (reliable.length ? reliable.map(getMemberName).join("\n") : "") +
    `\n\nMissed Once (${missedOnce.length})\n` +
    (missedOnce.length ? missedOnce.map(getMemberName).join("\n") : "") +
    `\n\nMissed Twice (${missedTwice.length})\n` +
    (missedTwice.length ? missedTwice.map(getMemberName).join("\n") : "");

  return { embedText, txtText };
}