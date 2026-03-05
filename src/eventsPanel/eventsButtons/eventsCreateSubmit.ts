import { ModalSubmitInteraction, Guild } from "discord.js";
import { EventObject, getEvents, saveEvents } from "../eventService";
import { sendEventCreatedNotification } from "./eventsReminder";
import { getEventDateUTC } from "../../utils/timeUtils";

/**
 * Parsuje różne dopuszczalne formaty daty i czasu na day/month/hour/minute
 * Obsługiwane formaty:
 * DD.MM HH:MM, DD/MM HH:MM, DD-MM HH:MM
 * DD.MM HHMM, DD/MM HHMM, DD-MM HHMM
 * DDMM HHMM
 * DDMMHHMM
 * Dopuszczalny rok opcjonalnie jako osobne pole
 */
function parseEventDateTime(input: string): { day: number; month: number; year?: number; hour: number; minute: number } | null {
    input = input.trim();
    if (!input) return null;

    // Regex obsługujący tylko bezpieczne formaty
    const dateTimeRegex = /^(\d{1,2})(?:[.\-/]?)(\d{1,2})\s*(\d{2})(?::?(\d{2}))?$/;
    const match = input.match(dateTimeRegex);
    if (!match) return null;

    let day = parseInt(match[1], 10);
    let month = parseInt(match[2], 10);
    let hour = parseInt(match[3], 10);
    let minute = match[4] ? parseInt(match[4], 10) : 0;

    // Walidacja godzin i minut
    if (hour > 23 || minute > 59) return null;

    // Sprawdzenie poprawności kalendarza dla bieżącego roku
    const nowYear = new Date().getUTCFullYear();
    const testDate = new Date(Date.UTC(nowYear, month - 1, day));
    if (testDate.getUTCDate() !== day || testDate.getUTCMonth() !== month - 1) return null;

    return { day, month, hour, minute };
}

export async function handleCreateSubmit(interaction: ModalSubmitInteraction) {
    const guildId = interaction.guildId!;
    const name = interaction.fields.getTextInputValue("event_name");
    const datetimeRaw = interaction.fields.getTextInputValue("event_datetime");
    const reminderRaw = interaction.fields.getTextInputValue("reminder_before");

    const reminderBefore = reminderRaw ? parseInt(reminderRaw, 10) : undefined;
    const parsed = parseEventDateTime(datetimeRaw);

    if (!name || !parsed) {
        await interaction.reply({
            content: "Invalid date/time input. Please use a valid format like 18.07 20:30 and check the calendar.",
            ephemeral: true
        });
        return;
    }

    const { day, month, hour, minute } = parsed;
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