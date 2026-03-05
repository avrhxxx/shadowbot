// src/eventsPanel/eventsButtons/eventsCreateSubmit.ts
import { 
    ModalSubmitInteraction, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} from "discord.js";
import { EventObject, getEvents, saveEvents } from "../eventService";
import { getEventDateUTC, formatEventUTC } from "../../utils/timeUtils";

const tempEventStore = new Map<string, { name: string; day: number; month: number; hour: number; minute: number; guildId: string }>();

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
    let eventDateUTC = year
        ? new Date(Date.UTC(year, month - 1, day, hour, minute))
        : getEventDateUTC(day, month, hour, minute);

    // 🔹 Obsługa Next Year jeśli brak roku i data już minęła
    if (!year && eventDateUTC.getTime() < nowUTC.getTime()) {
        tempEventStore.set(`${interaction.user.id}-temp`, { name, day, month, hour, minute, guildId });

        await interaction.reply({
            content: `The date ${formatEventUTC(day, month, hour, minute)} UTC has passed. Do you want to schedule it for next year?`,
            components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder().setCustomId("next_year_yes").setLabel("Yes").setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId("next_year_no").setLabel("No").setStyle(ButtonStyle.Danger)
                )
            ],
            ephemeral: true
        });
        return;
    }

    // 🔹 Teraz mamy finalną datę (rok podany lub obecny/next year) → zapisujemy event
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

    // 🔹 Wyświetlenie select menu do wyboru przypomnienia
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