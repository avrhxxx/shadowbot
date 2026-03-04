// src/eventsPanel/eventsButtons/eventsReminder.ts
import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  TextChannel,
  Guild
} from "discord.js";
import * as EventStorage from "../eventStorage";

/**
 * Pomocnicza funkcja – pad liczby zerem
 */
function pad(n: number) {
  return n < 10 ? `0${n}` : n;
}

/**
 * 🔹 Mapy dla timeoutów
 * Każdy event ma swój własny timeout, żeby przypomnienia się nie nakładały
 */
const reminderTimeouts = new Map<string, NodeJS.Timeout>();
const eventStartTimeouts = new Map<string, NodeJS.Timeout>();

/**
 * 🔹 Powiadomienie po stworzeniu eventu
 */
export async function sendEventCreatedNotification(event: any, guild: Guild) {
  const config = await EventStorage.getConfig(guild.id);
  if (!config?.notificationChannelId) return;

  const channel = guild.channels.cache.get(config.notificationChannelId) as TextChannel;
  if (!channel || !channel.isTextBased()) return;

  const eventDateStr = `${pad(event.day)}/${pad(event.month)} ${pad(event.hour)}:${pad(event.minute)} UTC`;

  const embed = new EmbedBuilder()
    .setTitle(`🎉 Event Created: ${event.name}`)
    .setDescription(`Event scheduled for ${eventDateStr}` +
      (event.reminderBefore !== undefined ? `\nReminder set ${event.reminderBefore} minutes before.` : "\nNo reminder set."))
    .setColor("Green");

  await channel.send({ content: "@everyone", embeds: [embed] });

  // 🔹 Zaplanuj automatyczne przypomnienia
  scheduleEventReminders(event, guild);
}

/**
 * KROK 1 – Manual Reminder
 */
export async function handleManualReminder(interaction: ButtonInteraction) {
  const guildId = interaction.guildId!;
  const events = await EventStorage.getEvents(guildId);
  const activeEvents = events.filter(e => e.status === "ACTIVE");

  if (activeEvents.length === 0) {
    await interaction.reply({ content: "No active events available.", flags: 64 });
    return;
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId("event_manual_reminder_select")
    .setPlaceholder("Select event for manual reminder")
    .addOptions(
      activeEvents.map(event =>
        new StringSelectMenuOptionBuilder()
          .setLabel(event.name)
          .setDescription(`${pad(event.day)}/${pad(event.month)} ${pad(event.hour)}:${pad(event.minute)} UTC`)
          .setValue(event.id)
      )
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  await interaction.reply({
    content: "Choose event to send reminder:",
    components: [row],
    flags: 64
  });
}

/**
 * KROK 2 – Obsługa select menu Manual Reminder
 */
export async function handleManualReminderSelect(interaction: StringSelectMenuInteraction) {
  const guildId = interaction.guildId!;
  const eventId = interaction.values[0];

  const events = await EventStorage.getEvents(guildId);
  const event = events.find(e => e.id === eventId);
  if (!event) {
    await interaction.reply({ content: "Event not found.", flags: 64 });
    return;
  }

  const config = await EventStorage.getConfig(guildId);
  if (!config?.notificationChannelId) {
    await interaction.reply({ content: "Notification channel not set.", flags: 64 });
    return;
  }

  const guild = interaction.guild!;
  const channel = guild.channels.cache.get(config.notificationChannelId) as TextChannel;
  if (!channel || !channel.isTextBased()) {
    await interaction.reply({ content: "Notification channel invalid.", flags: 64 });
    return;
  }

  await sendReminderMessage(channel, event);

  await interaction.update({ content: "Manual reminder sent!", components: [] });
}

/**
 * 🔹 Zaplanuj przypomnienia dla pojedynczego eventu
 */
function scheduleEventReminders(event: any, guild: Guild) {
  const config = EventStorage.getConfig(guild.id);
  if (!config?.notificationChannelId) return;

  const channel = guild.channels.cache.get(config.notificationChannelId) as TextChannel;
  if (!channel || !channel.isTextBased()) return;

  const nowUTC = new Date();
  const year = nowUTC.getUTCFullYear();
  const eventTime = new Date(Date.UTC(year, event.month - 1, event.day, event.hour, event.minute));

  // 🔹 Reminder przed eventem
  if (event.reminderBefore !== undefined) {
    const reminderTime = eventTime.getTime() - event.reminderBefore * 60 * 1000;
    const delayReminder = reminderTime - nowUTC.getTime();

    if (delayReminder > 0) {
      const timeout = setTimeout(() => {
        sendReminderMessage(channel, event);
        reminderTimeouts.delete(event.id);
      }, delayReminder);
      reminderTimeouts.set(event.id, timeout);
    }
  }

  // 🔹 Event Started
  const delayStart = eventTime.getTime() - nowUTC.getTime();
  if (delayStart > 0) {
    const timeout = setTimeout(async () => {
      await sendEventStarted(channel, event, guild);
      eventStartTimeouts.delete(event.id);
    }, delayStart);
    eventStartTimeouts.set(event.id, timeout);
  }
}

/**
 * 🔹 Własna funkcja wysyłająca przypomnienie przed eventem
 */
async function sendReminderMessage(channel: TextChannel, event: any) {
  const eventDateStr = `${pad(event.day)}/${pad(event.month)} ${pad(event.hour)}:${pad(event.minute)} UTC`;

  const embed = new EmbedBuilder()
    .setTitle(`⏰ Upcoming Event: ${event.name}`)
    .setDescription(`Event starts on ${eventDateStr}`)
    .setColor("Orange");

  await channel.send({ content: "@everyone", embeds: [embed] });
}

/**
 * 🔹 Własna funkcja wysyłająca przypomnienie, że event się rozpoczął
 */
async function sendEventStarted(channel: TextChannel, event: any, guild: Guild) {
  const eventDateStr = `${pad(event.day)}/${pad(event.month)} ${pad(event.hour)}:${pad(event.minute)} UTC`;

  const embed = new EmbedBuilder()
    .setTitle(`✅ Event Started: ${event.name}`)
    .setDescription(`The event scheduled for ${eventDateStr} has just started!`)
    .setColor("Blue");

  await channel.send({ content: "@everyone", embeds: [embed] });

  // 🔹 Aktualizujemy status w storage
  const events = await EventStorage.getEvents(guild.id);
  const e = events.find(ev => ev.id === event.id);
  if (e && e.status !== "PAST") {
    e.status = "PAST";
    await EventStorage.saveEvents(guild.id, events);
  }
}

/**
 * 🔹 Opcjonalnie – funkcje do czyszczenia timeoutów
 */
export function clearEventTimeouts(eventId: string) {
  const rem = reminderTimeouts.get(eventId);
  if (rem) clearTimeout(rem);
  reminderTimeouts.delete(eventId);

  const start = eventStartTimeouts.get(eventId);
  if (start) clearTimeout(start);
  eventStartTimeouts.delete(eventId);
}