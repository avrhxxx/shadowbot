import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  EmbedBuilder
} from "discord.js";
import * as EventStorage from "../eventStorage";

/**
 * KROK 1
 * Kliknięcie przycisku "Manual Reminder"
 * -> pokazuje select menu z aktywnymi eventami
 */
export async function handleManualReminder(
  interaction: ButtonInteraction
) {
  const guildId = interaction.guildId!;

  const events = await EventStorage.getEvents(guildId);
  const activeEvents = events.filter(e => e.status === "ACTIVE");

  if (activeEvents.length === 0) {
    await interaction.reply({
      content: "No active events available.",
      ephemeral: true
    });
    return;
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId("event_manual_reminder_select")
    .setPlaceholder("Select event for manual reminder")
    .addOptions(
      activeEvents.map(event =>
        new StringSelectMenuOptionBuilder()
          .setLabel(event.name)
          .setDescription(
            `${event.day}/${event.month} ${event.hour}:${event.minute}`
          )
          .setValue(event.id)
      )
    );

  const row =
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  await interaction.reply({
    content: "Choose event to send reminder:",
    components: [row],
    ephemeral: true
  });
}

/**
 * KROK 2
 * Obsługa wyboru eventu z select menu
 */
export async function handleManualReminderSelect(
  interaction: StringSelectMenuInteraction
) {
  const guildId = interaction.guildId!;
  const eventId = interaction.values[0];

  const events = await EventStorage.getEvents(guildId);
  const event = events.find(e => e.id === eventId);

  if (!event) {
    await interaction.reply({
      content: "Event not found.",
      ephemeral: true
    });
    return;
  }

  const config = await EventStorage.getConfig(guildId);

  if (!config?.defaultChannelId) {
    await interaction.reply({
      content: "Notification channel not set.",
      ephemeral: true
    });
    return;
  }

  const channel = interaction.guild!.channels.cache.get(
    config.defaultChannelId
  );

  if (!channel || !channel.isTextBased()) {
    await interaction.reply({
      content: "Notification channel invalid.",
      ephemeral: true
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`📢 Reminder: ${event.name}`)
    .setDescription(
      `Event starts on ${event.day}/${event.month} at ${event.hour}:${event.minute}`
    )
    .setColor("Blue");

  await channel.send({ embeds: [embed] });

  await interaction.update({
    content: "Manual reminder sent!",
    components: []
  });
}