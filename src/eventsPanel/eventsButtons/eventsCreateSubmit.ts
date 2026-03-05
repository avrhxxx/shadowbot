// src/eventsPanel/eventsButtons/eventsCreateSubmit.ts
import { 
    ModalSubmitInteraction, 
    Guild, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    ComponentType 
} from "discord.js";
import { EventObject, getEvents, saveEvents } from "../eventService";
import { sendEventCreatedNotification } from "./eventsReminder";
import { getEventDateUTC, formatEventUTC } from "../../utils/timeUtils";

const tempEventStore = new Map<string, EventObject>();

function parseEventDateTime(input: string) {
    const match = input.trim().match(/^(\d{1,2})(?:[.\-/]?)(\d{1,2})\s*(\d{2})(?::?(\d{2}))?$/);
    if (!match) return null;
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const hour = parseInt(match[3], 10);
    const minute = match[4] ? parseInt(match[4], 10) : 0;
    if (hour > 23 || minute > 59) return null;
    return { day, month, hour, minute };
}

export async function handleCreateSubmit(interaction: ModalSubmitInteraction) {
    const guildId = interaction.guildId!;
    const name = interaction.fields.getTextInputValue("event_name");
    const datetimeRaw = interaction.fields.getTextInputValue("event_datetime");
    const yearRaw = interaction.fields.getTextInputValue("event_year");

    const parsed = parseEventDateTime(datetimeRaw);
    if (!name || !parsed) {
        await interaction.reply({ content: "Invalid date/time format.", ephemeral: true });
        return;
    }

    const { day, month, hour, minute } = parsed;
    const year = yearRaw ? parseInt(yearRaw, 10) : undefined;
    const nowUTC = new Date();
    let eventDateUTC = year ? new Date(Date.UTC(year, month - 1, day, hour, minute)) : getEventDateUTC(day, month, hour, minute);

    // Obsługa Next Year / Cancel
    if (!year && eventDateUTC.getTime() < nowUTC.getTime()) {
        await interaction.reply({ content: `The date ${formatEventUTC(day, month, hour, minute)} UTC has passed. Use Next Year option.`, ephemeral: true });
        return;
    }

    // Tworzymy event w storage bez reminderBefore
    const events: EventObject[] = await getEvents(guildId);
    const newEvent: EventObject = {
        id: `${Date.now()}`,
        guildId,
        name,
        day,
        month,
        hour,
        minute,
        year: year ?? eventDateUTC.getUTCFullYear(),
        status: "ACTIVE",
        participants: [],
        createdAt: Date.now(),
        reminderSent: false,
        started: false
    };

    await saveEvents(guildId, [...events, newEvent]);
    tempEventStore.set(`${interaction.user.id}-${newEvent.id}`, newEvent);

    // ✅ Wyświetlenie select menu do wyboru przypomnienia
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`reminder_select_${interaction.user.id}-${newEvent.id}`)
        .setPlaceholder("Set reminder before event (optional)")
        .addOptions([
            { label: "No reminder", value: "0" },
            { label: "5 min before", value: "5" },
            { label: "15 min before", value: "15" },
            { label: "30 min before", value: "30" },
            { label: "1h before", value: "60" },
            { label: "2h before", value: "120" },
            { label: "6h before", value: "360" }
        ]);

    await interaction.reply({
        content: `Event "${name}" created. Please select a reminder time:`,
        components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu)],
        ephemeral: true
    });
}