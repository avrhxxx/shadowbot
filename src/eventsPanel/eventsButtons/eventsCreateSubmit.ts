import { ModalSubmitInteraction, Guild } from "discord.js";
import { EventObject, getEvents, saveEvents } from "../eventService";
import { sendEventCreatedNotification } from "./eventsReminder";
import { getEventDateUTC } from "../../utils/timeUtils";

/**
 * Parsuje formaty daty: DD.MM HH[:MM] | DD/MM HH[:MM] | DD-MM HH[:MM] | opcjonalnie YYYY
 */
function parseEventDatetime(input: string): { day: number; month: number; year?: number; hour: number; minute: number } | null {
  const trimmed = input.trim();
  const regex = /^(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?\s+(\d{1,2})(?::(\d{2}))?$/;
  const match = trimmed.match(regex);

  if (!match) return null;

  const day = parseInt(match[1]);
  const month = parseInt(match[2]);
  const year = match[3] ? parseInt(match[3]) : undefined;
  const hour = parseInt(match[4]);
  const minute = match[5] ? parseInt(match[5]) : 0;

  return { day, month, year, hour, minute };
}

/**
 * Validate real calendar date (blocks 31.02 etc)
 */
function isValidDate(day: number, month: number, year: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export async function handleCreateSubmit(interaction: ModalSubmitInteraction) {
  const guildId = interaction.guildId!;
  const name = interaction.fields.getTextInputValue("event_name").trim();
  const datetimeRaw = interaction.fields.getTextInputValue("event_datetime").trim();
  const reminderRaw = interaction.fields.getTextInputValue("reminder_before")?.trim();

  const reminderBefore = reminderRaw ? parseInt(reminderRaw, 10) : undefined;

  const parsed = parseEventDatetime(datetimeRaw);

  if (!name || !parsed) {
    await interaction.reply({ content: "Invalid input. Please check the event name and datetime format.", ephemeral: true });
    return;
  }

  const now = new Date();
  const year = parsed.year ?? now.getUTCFullYear();

  if (!isValidDate(parsed.day, parsed.month, year)) {
    await interaction.reply({ content: "Invalid date. This day does not exist in the selected month/year.", ephemeral: true });
    return;
  }

  const { day, month, hour, minute } = parsed;
  const eventDateUTC = getEventDateUTC(day, month, hour, minute);

  if (eventDateUTC.getTime() <= now.getTime()) {
    await interaction.reply({ content: "Cannot create an event in the past (UTC). Please select a future date/time.", ephemeral: true });
    return;
  }

  const events: EventObject[] = await getEvents(guildId);

  const duplicate = events.find(
    e => e.day === day && e.month === month && e.hour === hour && e.minute === minute && e.status === "ACTIVE"
  );

  if (duplicate) {
    await interaction.reply({ content: "An active event at this UTC date and time already exists. Please choose another date/time.", ephemeral: true });
    return;
  }

  const newEvent: EventObject = {
    id: `${Date.now()}`,
    guildId,
    name,
    day,
    month,
    hour,
    minute,
    status: "ACTIVE",
    participants: [],
    createdAt: Date.now(),
    ...(reminderBefore !== undefined && { reminderBefore })
  };

  await saveEvents(guildId, [...events, newEvent]);

  if (interaction.guild) {
    await sendEventCreatedNotification(newEvent, interaction.guild as Guild);
  }

  await interaction.reply({ content: `Event "${name}" created successfully!`, ephemeral: true });
}