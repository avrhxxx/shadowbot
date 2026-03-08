// src/eventsPanel/eventsButtons/eventsManualReminder.ts
import {
  ButtonInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder
} from "discord.js";
import { getEvents, EventObject } from "../eventService";
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

  const row = createEventSelectMenu(upcomingEvents, "manual_reminder_select", "Select an event to manually send a reminder");

  await interaction.reply({
    content: "Select an event to manually send a reminder:",
    components: [row],
    ephemeral: true
  });
}