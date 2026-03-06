// src/eventsPanel/eventsButtons/eventsManualReminder.ts
import { ButtonInteraction, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from "discord.js";
import { getEvents } from "../eventService";
import { sendReminderMessage } from "./eventsReminder";
import { formatEventUTC } from "../../utils/timeUtils";

/**
 * 🔹 Handler przycisku "Manual Reminder"
 * Wyświetla select menu z przyszłymi eventami
 */
export async function handleManualReminder(interaction: ButtonInteraction) {
  const guildId = interaction.guildId!;
  const events = await getEvents(guildId);

  const upcomingEvents = events.filter(e => e.status !== "PAST");
  if (upcomingEvents.length === 0) {
    await interaction.reply({ content: "No upcoming events to remind.", ephemeral: true });
    return;
  }

  const select = new StringSelectMenuBuilder()
    .setCustomId("manual_reminder_select")
    .setPlaceholder("Select an event to manually send a reminder")
    .addOptions(
      upcomingEvents.map(ev =>
        new StringSelectMenuOptionBuilder()
          .setLabel(ev.name)
          .setDescription(formatEventUTC(ev.day, ev.month, ev.hour, ev.minute, ev.year))
          .setValue(ev.id)
      )
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

  await interaction.reply({
    content: "Select an event to manually send a reminder:",
    components: [row],
    ephemeral: true
  });
}