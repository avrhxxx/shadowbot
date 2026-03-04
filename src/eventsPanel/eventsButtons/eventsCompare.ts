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

/**
 * Formatowanie daty eventu
 */
function formatDate(e: EventObject) {
  return `${e.day}/${e.month} ${e.hour}:${e.minute} UTC`;
}

/* ===================================================== */
/*  STEP 1 — CLICK COMPARE BUTTON                       */
/* ===================================================== */
export async function handleCompareButton(
  interaction: ButtonInteraction,
  eventId: string
) {
  const guildId = interaction.guildId!;
  const events: EventObject[] = await EventStorage.getEvents(guildId);

  const currentEvent = events.find(e => e.id === eventId);
  if (!currentEvent) {
    await interaction.reply({ content: "Event not found.", ephemeral: true });
    return;
  }
  if (currentEvent.status !== "PAST") {
    await interaction.reply({
      content: "You can only compare past events.",
      ephemeral: true
    });
    return;
  }

  const pastEvents = events
    .filter(e => e.status === "PAST" && e.id !== eventId)
    .sort((a, b) => b.createdAt - a.createdAt);

  if (pastEvents.length === 0) {
    await interaction.reply({
      content: "No other past events available to compare.",
      ephemeral: true
    });
    return;
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId(`compare_select_${eventId}`)
    .setPlaceholder("Select event to compare with")
    .addOptions(
      pastEvents.map(event =>
        new StringSelectMenuOptionBuilder()
          .setLabel(event.name)
          .setDescription(formatDate(event))
          .setValue(event.id)
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
/*  STEP 2 — HANDLE SELECT MENU                         */
/* ===================================================== */
export async function handleCompareSelect(
  interaction: StringSelectMenuInteraction
) {
  const guildId = interaction.guildId!;
  const selectedEventId = interaction.values[0];
  const currentEventId = interaction.customId.replace("compare_select_", "");

  const events: EventObject[] = await EventStorage.getEvents(guildId);
  const currentEvent = events.find(e => e.id === currentEventId);
  const selectedEvent = events.find(e => e.id === selectedEventId);

  if (!currentEvent || !selectedEvent) {
    await interaction.update({
      content: "One of the events no longer exists.",
      components: []
    });
    return;
  }

  const result = buildComparison(selectedEvent, currentEvent);

  const downloadButton = new ButtonBuilder()
    .setCustomId(`compare_download_${selectedEvent.id}_${currentEvent.id}`)
    .setLabel("Download")
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(downloadButton);

  // Pokazujemy porównanie w ephemeral + przycisk Download
  await interaction.update({
    content: result.embedText,
    components: [row]
  });
}

/* ===================================================== */
/*  STEP 3 — DOWNLOAD BUTTON                            */
/* ===================================================== */
export async function handleCompareDownload(
  interaction: ButtonInteraction
) {
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

  const result = buildComparison(eventA, eventB);

  const config = await EventStorage.getConfig(guildId);
  if (!config?.downloadChannelId) {
    await interaction.reply({
      content: "Download channel not configured.",
      ephemeral: true
    });
    return;
  }

  const channel = guild.channels.cache.get(config.downloadChannelId) as TextChannel;
  if (!channel || !channel.isTextBased()) {
    await interaction.reply({
      content: "Download channel invalid.",
      ephemeral: true
    });
    return;
  }

  // Wyślij zwykłą wiadomość z porównaniem + datą UTC
  const utcNow = new Date().toISOString();
  await channel.send({
    content: `📥 Attendance comparison (UTC: ${utcNow}):\n${result.embedText}`
  });

  // Wyślij plik TXT
  const file = new AttachmentBuilder(Buffer.from(result.txtText, "utf-8"), {
    name: `compare_${eventA.name}_vs_${eventB.name}.txt`
  });

  await channel.send({
    content: `File version of the comparison:`,
    files: [file]
  });

  await interaction.reply({
    content: "Comparison sent to download channel.",
    ephemeral: true
  });
}

/* ===================================================== */
/*  CORE LOGIC (REUSABLE)                               */
/* ===================================================== */
function buildComparison(eventA: EventObject, eventB: EventObject) {
  const participantsA = new Set(eventA.participants);
  const participantsB = new Set(eventB.participants);
  const absentA = new Set(eventA.absent || []);
  const absentB = new Set(eventB.absent || []);

  const reliable = [...participantsA].filter(id => participantsB.has(id));
  const missedOnce = [...participantsA].filter(id => absentB.has(id));
  const missedTwice = [...absentA].filter(id => absentB.has(id));

  const embedText =
    `Comparing:\n` +
    `Event A: ${eventA.name} (${formatDate(eventA)})\n` +
    `Event B: ${eventB.name} (${formatDate(eventB)})\n\n` +
    `🟢 Reliable (${reliable.length})\n` +
    (reliable.length ? reliable.map(id => `<@${id}>`).join("\n") : "None") +
    `\n\n🟡 Missed Once (${missedOnce.length})\n` +
    (missedOnce.length ? missedOnce.map(id => `<@${id}>`).join("\n") : "None") +
    `\n\n🔴 Missed Twice (${missedTwice.length})\n` +
    (missedTwice.length ? missedTwice.map(id => `<@${id}>`).join("\n") : "None");

  const txtText =
    `Attendance Comparison\n` +
    `=====================\n\n` +
    `Event A: ${eventA.name} (${formatDate(eventA)})\n` +
    `Event B: ${eventB.name} (${formatDate(eventB)})\n\n` +
    `Reliable (${reliable.length})\n` +
    (reliable.length ? reliable.join("\n") : "") +
    `\n\nMissed Once (${missedOnce.length})\n` +
    (missedOnce.length ? missedOnce.join("\n") : "") +
    `\n\nMissed Twice (${missedTwice.length})\n` +
    (missedTwice.length ? missedTwice.join("\n") : "");

  return { embedText, txtText };
}