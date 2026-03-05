import { ModalSubmitInteraction, Guild } from "discord.js";
import { EventObject, getEvents, saveEvents } from "../eventService";
import { sendEventCreatedNotification } from "./eventsReminder";
import { getEventDateUTC } from "../../utils/timeUtils";

/**
 * Parsuje różne formaty daty i czasu na day/month/hour/minute
 */
function parseEventDateTime(input: string): { day: number; month: number; year?: number; hour: number; minute: number } | null {
    input = input.trim();
    if (!input) return null;

    const dateTimeRegex = /^(\d{1,2})[.\-/](\d{1,2})(?:[.\-/](\d{2,4}))?\s+(\d{1,2})(?::?(\d{2}))?$/;
    const match = input.match(dateTimeRegex);
    if (!match) return null;

    const [, dayStr, monthStr, yearStr, hourStr, minuteStr] = match;
    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10);
    const year = yearStr ? parseInt(yearStr, 10) : undefined;
    const hour = parseInt(hourStr, 10);
    const minute = minuteStr ? parseInt(minuteStr, 10) : 0;

    // Sprawdzenie zakresów godzin i minut
    if (hour > 23 || minute > 59) return null;

    // Walidacja kalendarza
    const nowYear = new Date().getUTCFullYear();
    const testYear = year || nowYear;
    const testDate = new Date(Date.UTC(testYear, month - 1, day, hour, minute));
    if (testDate.getUTCDate() !== day || testDate.getUTCMonth() !== month - 1) return null;

    return { day, month, year, hour, minute };
}

export async function handleCreateSubmit(interaction: ModalSubmitInteraction) {
    const guildId = interaction.guildId!;
    const name = interaction.fields.getTextInputValue("event_name");
    const datetimeRaw = interaction.fields.getTextInputValue("event_datetime");
    const reminderRaw = interaction.fields.getTextInputValue("reminder_before");

    const reminderBefore = reminderRaw ? parseInt(reminderRaw, 10) : undefined;
    const parsed = parseEventDateTime(datetimeRaw);

    if (!name || !parsed) {
        await interaction.reply({ content: "Invalid date/time input. Please check format and calendar.", ephemeral: true });
        return;
    }

    const { day, month, year, hour, minute } = parsed;
    const eventDateUTC = getEventDateUTC(day, month, hour, minute);
    const nowUTC = new Date();

    if (eventDateUTC.getTime() < nowUTC.getTime()) {
        await interaction.reply({
            content: "Cannot create an event in the past (UTC). Please select a future date/time.",
            ephemeral: true
        });
        return;
    }

    const events: EventObject[] = await getEvents(guildId);
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