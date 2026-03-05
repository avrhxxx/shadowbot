import { ModalSubmitInteraction, Guild } from "discord.js";
import { EventObject, getEvents, saveEvents } from "../eventService";
import { sendEventCreatedNotification } from "./eventsReminder";
import { getEventDateUTC } from "../../utils/timeUtils";

/**
 * Convert various time formats into HH:MM
 */
function parseTime(input: string): { hour: number; minute: number } | null {

  input = input.trim();
  if (!input) return null;

  if (input.includes(":")) {
    const [h, m] = input.split(":").map(n => parseInt(n, 10));

    if (isNaN(h) || isNaN(m)) return null;
    if (h > 23 || m > 59) return null;

    return { hour: h, minute: m };
  }

  if (/^\d{1,4}$/.test(input)) {

    const s = input.padStart(4, "0");

    const hour = parseInt(s.slice(0, 2), 10);
    const minute = parseInt(s.slice(2), 10);

    if (hour > 23 || minute > 59) return null;

    return { hour, minute };
  }

  return null;
}

/**
 * Validate real calendar date (blocks 31.02 etc)
 */
function isValidDate(day: number, month: number): boolean {

  const year = new Date().getUTCFullYear();

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export async function handleCreateSubmit(interaction: ModalSubmitInteraction) {

  const guildId = interaction.guildId!;

  const name = interaction.fields.getTextInputValue("event_name");
  const day = parseInt(interaction.fields.getTextInputValue("event_day"), 10);
  const month = parseInt(interaction.fields.getTextInputValue("event_month"), 10);
  const timeRaw = interaction.fields.getTextInputValue("event_time");
  const reminderRaw = interaction.fields.getTextInputValue("reminder_before");

  const reminderBefore = reminderRaw ? parseInt(reminderRaw, 10) : undefined;

  const parsedTime = parseTime(timeRaw);

  if (!name || isNaN(day) || isNaN(month) || !parsedTime) {

    await interaction.reply({
      content: "Invalid input. Please check all fields.",
      ephemeral: true
    });

    return;
  }

  /**
   * Validate real calendar date
   */

  if (!isValidDate(day, month)) {

    await interaction.reply({
      content: "Invalid date. This day does not exist in the selected month.",
      ephemeral: true
    });

    return;
  }

  const { hour, minute } = parsedTime;

  const eventDateUTC = getEventDateUTC(day, month, hour, minute);
  const nowUTC = new Date();

  /**
   * Block past events
   */

  if (eventDateUTC.getTime() < nowUTC.getTime()) {

    await interaction.reply({
      content: "Cannot create an event in the past (UTC). Please select a future date/time.",
      ephemeral: true
    });

    return;
  }

  const events: EventObject[] = await getEvents(guildId);

  /**
   * Prevent duplicate ACTIVE events
   */

  const duplicate = events.find(
    e =>
      e.day === day &&
      e.month === month &&
      e.hour === hour &&
      e.minute === minute &&
      e.status === "ACTIVE"
  );

  if (duplicate) {

    await interaction.reply({
      content: "An active event at this UTC date and time already exists. Please choose another date/time.",
      ephemeral: true
    });

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

  await interaction.reply({
    content: "Event created successfully!",
    ephemeral: true
  });
}