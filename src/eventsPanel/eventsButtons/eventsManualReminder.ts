// src/eventsPanel/eventsButtons/eventsManualReminder.ts
import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  TextChannel
} from "discord.js";
import { getEvents, EventObject, getConfig } from "../eventService";
import { sendReminderMessage } from "./eventsReminder";
import { formatEventUTC } from "../../utils/timeUtils";

/* ======================================================
   HELPERS
====================================================== */
function createEventSelectMenu(events: EventObject[], customId: string, placeholder: string) {
  const options = events.map(ev =>
    new StringSelectMenuOptionBuilder()
      .setLabel(ev.name)
      .setDescription(formatEventUTC(ev.day, ev.month, ev.hour, ev.minute, ev.year))
      .setValue(ev.id)
  );

  const menu = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(placeholder)
    .addOptions(options);

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

/* ======================================================
   HANDLE MANUAL REMINDER BUTTON
====================================================== */
export async function handleManualReminder(interaction: ButtonInteraction) {
  const guildId = interaction.guildId!;
  const events = await getEvents(guildId);
  const upcomingEvents = events.filter(e => e.status !== "PAST");

  if (!upcomingEvents.length) {
    await interaction.reply({ content: "No upcoming events to remind.", ephemeral: true });
    return;
  }

  const row = createEventSelectMenu(
    upcomingEvents,
    "manual_reminder_select",
    "Select an event to manually send a reminder"
  );

  await interaction.reply({
    content: "Select an event to manually send a reminder:",
    components: [row],
    ephemeral: true
  });
}

/* ======================================================
   HANDLE MANUAL REMINDER SELECT
====================================================== */
export async function handleManualReminderSelect(interaction: StringSelectMenuInteraction) {
  const guildId = interaction.guildId!;
  const selectedEventId = interaction.values[0];
  if (!selectedEventId) {
    await interaction.reply({ content: "No event selected.", ephemeral: true });
    return;
  }

  const events = await getEvents(guildId);
  const event = events.find(e => e.id === selectedEventId);
  if (!event) {
    await interaction.reply({ content: "Event not found.", ephemeral: true });
    return;
  }

  const config = await getConfig(guildId);
  const channelId = config.notificationChannel;
  if (!channelId) {
    await interaction.reply({ content: "Notification channel not set.", ephemeral: true });
    return;
  }

  const rawChannel = interaction.guild?.channels.cache.get(channelId);
  if (!rawChannel || !rawChannel.isTextBased()) {
    await interaction.reply({ content: "Notification channel invalid.", ephemeral: true });
    return;
  }

  const channel = rawChannel as TextChannel;
  await sendReminderMessage(channel, event);

  await interaction.update({
    content: `Manual reminder sent for **${event.name}**`,
    components: []
  });
}