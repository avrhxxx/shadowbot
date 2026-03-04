import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
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

  const eventDateStr = `${pad(event.day)}/${pad(event.month)} ${pad(event.hour)}:${pad(event.minute)} UTC`;

  const embed = new EmbedBuilder()
    .setTitle(`📢 Reminder: ${event.name}`)
    .setDescription(`Event starts on ${eventDateStr}`)
    .setColor("Blue");

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`show_local_time_${event.id}`)
      .setLabel("Show in your local time")
      .setStyle(ButtonStyle.Primary)
  );

  // 🔹 Wyślij everyone
  await channel.send({ content: "@everyone", embeds: [embed], components: [buttonRow] });

  await interaction.update({ content: "Manual reminder sent!", components: [] });
}

/**
 * Auto Reminder
 */
export async function sendAutoReminder(event: any, guild: Guild) {
  const guildId = guild.id;
  const config = await EventStorage.getConfig(guildId);
  if (!config?.notificationChannelId) return;

  const channel = guild.channels.cache.get(config.notificationChannelId) as TextChannel;
  if (!channel || !channel.isTextBased()) return;

  const eventDateStr = `${pad(event.day)}/${pad(event.month)} ${pad(event.hour)}:${pad(event.minute)} UTC`;

  const embed = new EmbedBuilder()
    .setTitle(`⏰ Upcoming Event: ${event.name}`)
    .setDescription(`Event starts on ${eventDateStr}`)
    .setColor("Orange");

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`show_local_time_${event.id}`)
      .setLabel("Show in your local time")
      .setStyle(ButtonStyle.Primary)
  );

  await channel.send({ content: "@everyone", embeds: [embed], components: [buttonRow] });
}